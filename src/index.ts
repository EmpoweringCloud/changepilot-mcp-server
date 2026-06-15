#!/usr/bin/env node
// Entry point.  Wires every tool into an MCP server over stdio so MCP hosts
// like Claude Code can invoke them.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { loadConfig, ClientConfig } from "./client.js";
import {
  listMessageCenterItems,
  listMessageCenterItemsSchema,
  getMessageCenterItem,
  getMessageCenterItemSchema,
  getMessageCenterItemEvents,
  getMessageCenterItemEventsSchema,
  getMessageCenterMeta,
} from "./tools/messageCenter.js";
import {
  listRoadmapItems,
  listRoadmapItemsSchema,
  getRoadmapItem,
  getRoadmapItemSchema,
  getRoadmapItemHistory,
  getRoadmapItemHistorySchema,
  listRoadmapDateChanges,
  listRoadmapDateChangesSchema,
  getRoadmapMeta,
} from "./tools/roadmap.js";
import {
  listTaxonomyProducts,
  listTaxonomyStatuses,
  listTaxonomyChangeCategories,
} from "./tools/taxonomy.js";

function buildServer(cfg: ClientConfig): McpServer {
  const server = new McpServer({
    name: "changepilot-mcp",
    version: "0.1.0",
  });

  // Each tool returns the raw JSON from the API.  We stringify it as the
  // MCP `text` content type — Claude Code parses JSON-in-text well and this
  // keeps the wire format flat.
  const wrap = <T>(fn: (cfg: ClientConfig, args: T) => Promise<unknown>) =>
    async (args: T) => {
      try {
        const result = await fn(cfg, args);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (err) {
        const e = err as { message?: string; status?: number; body?: unknown };
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                { error: e.message ?? "Unknown error", status: e.status, body: e.body },
                null,
                2,
              ),
            },
          ],
        };
      }
    };

  // --- Message Center ---
  server.tool(
    "list_message_center_items",
    "List Microsoft 365 Message Center items, optionally filtered by product, change category, admin/user impact and date windows.  Tenant-scoped when the bearer token belongs to a user whose tenant ID is known to ChangePilot; otherwise returns only publicly-visible items.",
    listMessageCenterItemsSchema,
    wrap(listMessageCenterItems),
  );
  server.tool(
    "get_message_center_item",
    "Get the full curated record (description, action required, links, video, deploy/preview dates, platforms, cloud instances, last events) for a single Message Center item.",
    getMessageCenterItemSchema,
    wrap(getMessageCenterItem),
  );
  server.tool(
    "get_message_center_item_events",
    "Get the Microsoft-published modification history (added/updated events) for a single Message Center item.",
    getMessageCenterItemEventsSchema,
    wrap(getMessageCenterItemEvents),
  );
  server.tool(
    "get_message_center_meta",
    "Dashboard meta for Message Center: 6 sidebar counts (all/action/new/upcoming/highadmin/highuser/preview), tenant id, and the most recent ingest timestamp.",
    {},
    wrap((cfg) => getMessageCenterMeta(cfg)),
  );

  // --- Roadmap ---
  server.tool(
    "list_roadmap_items",
    "List Microsoft 365 Roadmap items, optionally filtered by status, product, platform, cloud instance and date windows.  Not tenant-scoped — the Roadmap feed is Microsoft's global dataset.",
    listRoadmapItemsSchema,
    wrap(listRoadmapItems),
  );
  server.tool(
    "get_roadmap_item",
    "Get the full Roadmap record for a single Roadmap ID, including description, cloud instances, platforms and rollout dates.",
    getRoadmapItemSchema,
    wrap(getRoadmapItem),
  );
  server.tool(
    "get_roadmap_item_history",
    "Get the change history (added, status changes, date changes, removals) for a single Roadmap item.",
    getRoadmapItemHistorySchema,
    wrap(getRoadmapItemHistory),
  );
  server.tool(
    "list_roadmap_date_changes",
    "List discrete 'public-disclosure availability date' change events on Microsoft 365 Roadmap items — one row per change.  Useful for spotting slips and brought-forward releases.",
    listRoadmapDateChangesSchema,
    wrap(listRoadmapDateChanges),
  );
  server.tool(
    "get_roadmap_meta",
    "Dashboard meta for Roadmap: 6 sidebar counts and the most recent ingest timestamp.",
    {},
    wrap((cfg) => getRoadmapMeta(cfg)),
  );

  // --- Taxonomy / reference data ---
  server.tool(
    "list_taxonomy_products",
    "List the product labels used by both feeds (Microsoft Teams, SharePoint, etc.). Cached server-side.",
    {},
    wrap((cfg) => listTaxonomyProducts(cfg)),
  );
  server.tool(
    "list_taxonomy_statuses",
    "List the Roadmap status labels (In development, Rolling out, Launched, Cancelled).",
    {},
    wrap((cfg) => listTaxonomyStatuses(cfg)),
  );
  server.tool(
    "list_taxonomy_change_categories",
    "List the Microsoft-defined Message Center change categories (Stay informed, Plan for change, Prevent or fix issue, Plan for action).",
    {},
    wrap((cfg) => listTaxonomyChangeCategories(cfg)),
  );

  // --- Self-describing tool ---
  // Lets the LLM ask "what can you do?" without scanning every tool.
  server.tool(
    "describe_server",
    "Return a short JSON description of this MCP server, its endpoints and the authentication scheme.  Call once at the start of a session if unsure what's available.",
    {},
    async () => {
      const desc = {
        name: "changepilot-mcp",
        version: "0.1.0",
        apiBaseUrl: cfg.baseUrl,
        endpoints: [
          "list_message_center_items",
          "get_message_center_item",
          "get_message_center_item_events",
          "get_message_center_meta",
          "list_roadmap_items",
          "get_roadmap_item",
          "get_roadmap_item_history",
          "list_roadmap_date_changes",
          "get_roadmap_meta",
          "list_taxonomy_products",
          "list_taxonomy_statuses",
          "list_taxonomy_change_categories",
        ],
        auth: "Personal API token (cpat_*) supplied via CHANGEPILOT_API_TOKEN env var",
      };
      return { content: [{ type: "text" as const, text: JSON.stringify(desc, null, 2) }] };
    },
  );

  // Suppress unused-z warning when no schema-typed tool is wired yet.
  void z;

  return server;
}

async function main() {
  const cfg = loadConfig();
  const server = buildServer(cfg);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Helpful breadcrumb in the MCP host log; goes to stderr so it doesn't
  // corrupt the JSON-RPC stream on stdout.
  process.stderr.write(`changepilot-mcp connected · base=${cfg.baseUrl}\n`);
}

main().catch((err) => {
  process.stderr.write(`changepilot-mcp failed to start: ${err?.message ?? err}\n`);
  process.exit(1);
});
