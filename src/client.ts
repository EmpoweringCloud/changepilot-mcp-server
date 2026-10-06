// Thin HTTP wrapper around the ChangePilot reporting API.  Authentication is
// a personal bearer token supplied via env (CHANGEPILOT_API_TOKEN) that is
// minted in the ChangePilot portal under Profile → Personal API Tokens and
// looks like `cpat_<…>`.
//
// All ChangePilot API traffic is fronted by Azure API Management at
// `changepilot.azure-api.net`, which requires a subscription key alongside
// the bearer token.
//
// DEFAULT_MGMT_KEY is a PUBLIC CLIENT KEY, not a secret, and it is in this
// public repository on purpose. It identifies "the MCP client" to the
// gateway, so MCP traffic can be rate-limited and metered apart from the
// portal's; every copy of this client carries the same one, exactly as the
// portal's own gateway key is in every browser. On its own it reads nothing:
// every request also needs the user's personal `cpat_` token, which IS a
// secret and is never stored here. The gateway rate-limits callers by IP.
// Secret scanners will flag it; that is expected.
//
// Override via CHANGEPILOT_API_MGMT_KEY for staging/dev.

const DEFAULT_BASE_URL = "https://changepilot.azure-api.net";
const DEFAULT_MGMT_KEY = "3e028b54c82d446db9df7a676eb7a5b7";

export interface ClientConfig {
  baseUrl: string;
  token: string;
  mgmtKey: string;
}

export function loadConfig(): ClientConfig {
  const token = process.env.CHANGEPILOT_API_TOKEN;
  if (!token) {
    // The MCP host (Claude Code, etc.) shows this string to the user when the
    // server fails to start, so we make it actionable.
    throw new Error(
      "CHANGEPILOT_API_TOKEN is not set. Generate a personal API token in the " +
        "ChangePilot portal (Profile → Personal API Tokens) and add it to your MCP " +
        "client config.",
    );
  }
  const baseUrl = (process.env.CHANGEPILOT_API_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const mgmtKey = process.env.CHANGEPILOT_API_MGMT_KEY ?? DEFAULT_MGMT_KEY;
  return { baseUrl, token, mgmtKey };
}

export interface ApiError extends Error {
  status: number;
  body: unknown;
}

function buildQuery(params: Record<string, unknown> | undefined): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const v of value) {
        if (v === undefined || v === null || v === "") continue;
        qs.append(key, String(v));
      }
    } else if (value instanceof Date) {
      qs.append(key, value.toISOString());
    } else {
      qs.append(key, String(value));
    }
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export async function apiGet<T>(
  cfg: ClientConfig,
  path: string,
  query?: Record<string, unknown>,
): Promise<T> {
  const url = `${cfg.baseUrl}${path}${buildQuery(query)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      // APIM subscription key — required by changepilot.azure-api.net.
      "EmpoweringCloudAPI-key": cfg.mgmtKey,
      Authorization: `Bearer ${cfg.token}`,
      Accept: "application/json",
      "User-Agent": "changepilot-mcp/0.1",
    },
  });
  if (!res.ok) {
    let body: unknown = null;
    try { body = await res.json(); } catch { body = await res.text().catch(() => null); }
    const err = new Error(`ChangePilot API ${res.status} for GET ${path}`) as ApiError;
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return (await res.json()) as T;
}
