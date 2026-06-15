# changepilot-mcp-server

A [Model Context Protocol](https://modelcontextprotocol.io/) server that
wraps the [ChangePilot](https://changepilot.cloud) reporting API so AI
coding and chat agents — Claude Code, Claude Desktop, ChatGPT, Cursor,
Windsurf — can answer questions about Microsoft 365 Message Center items
and Roadmap items directly.

> _"Any high-impact Teams changes rolling out in the next 60 days?"_
>
> _"Has the rollout date for Roadmap ID 395820 slipped at all?"_
>
> _"Find Message Center items mentioning 'Copilot' that have a preview
> date in the next 90 days, and summarise the action required for each."_

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

## Disclaimer

This project is provided **"as is"** without warranty of any kind. It is
a thin convenience wrapper around the ChangePilot reporting API and is
intended for read-only, advisory use. **Do not** rely on it as the sole
source of truth for compliance, change-management or operational
decisions — always verify critical findings against the ChangePilot
portal or Microsoft's own feeds. See [LICENSE](./LICENSE) for the full
no-liability terms.

A ChangePilot subscription with API access is required to use this
server.

## Tools

All tools speak stdio MCP and return JSON.

| Tool                              | Description |
| --------------------------------- | ----------- |
| `list_message_center_items`       | Filter/sort/paginate Message Center items. |
| `get_message_center_item`         | Full curated record for a single MCID. |
| `get_message_center_item_events`  | Modification history for a single MCID. |
| `get_message_center_meta`         | Sidebar counts + last-data-refresh. |
| `list_roadmap_items`              | Filter/sort/paginate Roadmap items. |
| `get_roadmap_item`                | Full record for a single Roadmap ID. |
| `get_roadmap_item_history`        | Change history for a single Roadmap ID. |
| `list_roadmap_date_changes`       | One row per public-disclosure availability date change — slip detection. |
| `get_roadmap_meta`                | Sidebar counts + last-data-refresh. |
| `list_taxonomy_products`          | Product labels used by both feeds. |
| `list_taxonomy_statuses`          | Roadmap status labels. |
| `list_taxonomy_change_categories` | Message Center change-category labels. |
| `describe_server`                 | Self-describing JSON for "what can you do?" |

## Auth

Authentication is a personal API token minted in the ChangePilot portal:

1. Open <https://portal.changepilot.cloud/profile> → **Personal API Tokens**.
2. Click **New token**, give it a name (e.g. "Claude Code on laptop").
3. Copy the `cpat_…` value — it is shown only once.

The token inherits the same data-access rights as the user that minted
it. Revoke at any time on the same page; revocation propagates within
~60 seconds.

## Install — Claude Code

```sh
claude mcp add changepilot \
  --env CHANGEPILOT_API_TOKEN=cpat_xxxxxxxxxxxxxxxxxxxxxxxx \
  -- npx -y @changepilot/mcp-server
```

…or edit `~/.claude/mcp.json` (or your project's `.mcp.json`) directly:

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

Verify with `/mcp` inside Claude Code — you should see `changepilot`
listed with twelve tools.

## Install — Claude Desktop / Cursor / other MCP clients

Any MCP host that supports stdio servers will work. The pattern is the
same: configure the host to run `npx -y @changepilot/mcp-server` with
`CHANGEPILOT_API_TOKEN` in the environment.

## Environment variables

| Var                        | Default                              | Notes |
| -------------------------- | ------------------------------------ | ----- |
| `CHANGEPILOT_API_TOKEN`    | _(required)_                         | Personal API token from the portal. |
| `CHANGEPILOT_API_URL`      | `https://changepilot.azure-api.net`  | Override for staging/dev. |
| `CHANGEPILOT_API_MGMT_KEY` | _(baked-in default)_                 | Azure API Management subscription key. Dedicated to MCP traffic so the gateway can rate-limit and meter it independently from the portal; not a user secret. |

## Local development

```sh
git clone https://github.com/EmpoweringCloud/changepilot-mcp-server.git
cd changepilot-mcp-server
npm install
CHANGEPILOT_API_TOKEN=cpat_... npm run dev
```

Useful scripts:

- `npm run dev` — run with tsx (no build step).
- `npm run build` — compile to `dist/`.
- `npm run typecheck` — type-check only.

## Reporting issues

Open an issue on this repository. Please **do not** paste raw tokens or
tenant-identifiable data; redact the bearer token and any MCID/Roadmap
IDs you'd prefer to keep private.

## License

[MIT](./LICENSE). No warranty, no liability — see the license text and
the [Disclaimer](#disclaimer) above.
