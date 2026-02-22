# Linear Cycles MCP Server

MCP server for Linear cycle management operations not available in the standard Linear MCP.

## Purpose

Extends Linear MCP capabilities with cycle lifecycle management:
- Create new cycles with date ranges
- Update existing cycle properties
- Delete cycles
- Get cycle metrics (velocity, completion rates)

## Architecture

```
src/
├── index.ts                 # CLI entry with stdio transport + FTUE
├── server.ts                # McpServer setup, tool registration
├── auth/
│   └── keyManager.ts        # API key from ~/.claude/plugins/.env
├── types/
│   ├── cycle.ts             # Cycle domain types
│   └── metrics.ts           # Metrics types
├── schemas/
│   └── index.ts             # Zod validation schemas
├── client/
│   └── linear.ts            # GraphQL client with auth
├── handlers/
│   ├── base.ts              # Abstract handler interface
│   ├── manageAuth.ts        # FTUE: API key setup/status/remove
│   ├── createCycle.ts       # Create cycle handler
│   ├── updateCycle.ts       # Update cycle handler
│   ├── deleteCycle.ts       # Delete cycle handler
│   └── getCycleMetrics.ts   # Metrics handler
└── graphql/
    └── mutations.ts         # GraphQL operations
```

## Tools

| Tool | Description |
|------|-------------|
| `manage_auth` | FTUE: Configure API key (status/setup/remove) |
| `create_cycle` | Create a new cycle for a team |
| `update_cycle` | Update cycle name, dates, description |
| `delete_cycle` | Delete a cycle by ID |
| `get_cycle_metrics` | Get velocity and completion metrics |

## First-Time User Experience

On first run without an API key, the server shows setup instructions and remains running. Use `manage_auth` to configure:

```
manage_auth({ action: "setup", apiKey: "lin_api_..." })
```

## Environment

API key is configured in the global plugins .env (single source of truth):

```
~/.claude/plugins/.env
```

Add: `LINEAR_API_KEY=lin_api_your_key_here`

Or use the `manage_auth` tool to configure it.

## Development

```bash
# Install dependencies
bun install

# Type check
bun run lint

# Build for npm publishing
bun run build

# Run compiled version
bun run start

# Development with watch mode (runs TypeScript directly)
bun run dev

# Run tests
bun run test
```

## MCP Configuration

### Via npx (recommended after npm publish)

Add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "linear-cycles": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@cocal/linear-cycles-mcp"]
    }
  }
}
```

### Local development

```json
{
  "mcpServers": {
    "linear-cycles": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/linear-cycles-mcp/dist/index.js"],
      "env": {
        "LINEAR_API_KEY": "lin_api_..."
      }
    }
  }
}
```

## npm Publishing

```bash
# Build and verify
bun run build

# Publish to npm (requires npm login)
npm publish --access public
```

## Implementation Status

- [x] Project scaffold
- [x] manageAuth handler (FTUE)
- [x] createCycle handler
- [x] updateCycle handler
- [x] deleteCycle handler (uses archive semantics)
- [x] getCycleMetrics handler
- [x] API key storage with keyManager
- [x] npx publishing pattern
- [ ] Integration tests
