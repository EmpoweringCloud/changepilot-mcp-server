# @changepilot/mcp-server

A Model Context Protocol server that wraps the ChangePilot reporting API so
AI coding/chat agents (Claude Code, Claude Desktop, ChatGPT, Cursor, etc.)
can answer questions about Microsoft 365 Message Center items and Roadmap
items directly.

## What it can do

Tools exposed over stdio (all return JSON):

| Tool                              | Description |
| --------------------------------- | ----------- |
| `list_message_center_items`       | Filter/sort/paginate Message Center items. |
| `get_message_center_item`         | Full curated record for a single MCID. |
| `get_message_center_item_events`  | Modification history for a single MCID. |
| `get_message_center_meta`         | Sidebar counts + last-data-refresh. |
| `list_roadmap_items`              | Filter/sort/paginate Roadmap items. |
| `get_roadmap_item`                | Full record for a single Roadmap ID. |
| `get_roadmap_item_history`        | Change history for a single Roadmap ID. |
| `list_roadmap_date_changes`       | One row per "public-disclosure availability date" event — slip detection. |
| `get_roadmap_meta`                | Sidebar counts + last-data-refresh. |
| `list_taxonomy_products`          | Product labels used by both feeds. |
| `list_taxonomy_statuses`          | Roadmap status labels. |
| `list_taxonomy_change_categories` | Message Center change-category labels. |
| `describe_server`                 | Self-describing JSON for "what can you do?" |

## Auth

Authentication is a personal API token minted in the ChangePilot portal:

1. Open <https://portal.changepilot.cloud/profile> → **API Tokens**.
2. Click **New token**, give it a name (e.g. "Claude Code on Tom's laptop").
3. Copy the `cpat_…` value — it is shown once.

The token inherits the same access rights as the user that minted it.

## Install (Claude Code)

```sh
claude mcp add changepilot -- npx -y @changepilot/mcp-server
```

…then set the token in your Claude Code MCP config:

```jsonc
{
  "mcpServers": {
    "changepilot": {
      "command": "npx",
      "args": ["-y", "@changepilot/mcp-server"],
      "env": {
        "CHANGEPILOT_API_TOKEN": "cpat_xxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

## Local development

```sh
cd mcp-server
npm install
CHANGEPILOT_API_TOKEN=cpat_... npm run dev
```

## Environment variables

| Var                       | Default                          | Notes |
| ------------------------- | -------------------------------- | ----- |
| `CHANGEPILOT_API_TOKEN`   | _(required)_                     | Personal API token from the portal. |
| `CHANGEPILOT_API_URL`     | `https://api.changepilot.cloud`  | Override for staging/dev. |
