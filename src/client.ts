// Thin HTTP wrapper around the ChangePilot reporting API.  Authentication is
// a single bearer token supplied via env (CHANGEPILOT_API_TOKEN).  The token
// is minted in the ChangePilot portal under Profile → API Tokens and looks
// like `cpat_<…>`.

const DEFAULT_BASE_URL = "https://api.changepilot.cloud";

export interface ClientConfig {
  baseUrl: string;
  token: string;
}

export function loadConfig(): ClientConfig {
  const token = process.env.CHANGEPILOT_API_TOKEN;
  if (!token) {
    // The MCP host (Claude Code, etc.) shows this string to the user when the
    // server fails to start, so we make it actionable.
    throw new Error(
      "CHANGEPILOT_API_TOKEN is not set. Generate a personal API token in the " +
        "ChangePilot portal (Profile → API Tokens) and add it to your MCP " +
        "client config.",
    );
  }
  const baseUrl = (process.env.CHANGEPILOT_API_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  return { baseUrl, token };
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
