# workspace-company-marketplace

Executive suite marketplace for Claude Code. Provides board orchestration, engineering lead (Addy), product engineer (Alara), sprint planning, and Araba command router.

## Plugin

| Plugin | Commands | Description |
|--------|----------|-------------|
| company | `/company:board`, `/company:addy`, `/company:alara`, `/company:sprint`, `/company:araba` | Executive suite with strategic decision-making, sprint planning, and command routing |

## Requirements

- Claude Code CLI
- `LINEAR_API_KEY` in macOS Keychain (resolved at runtime via Keychain Resolver MCP, for sprint/cycle features)

## Cross-Marketplace Dependencies

This marketplace references agents from other marketplaces:

- **workspace-development** - Swift, Python, TypeScript specialist agents (used by Addy for engineering routing)
- **workspace-design** - UX/UI/Motion/System design reviewers (used by Alara for design review routing)
- **workspace-service** - linear-service agent (used by Sprint for current cycle data), life-calendar agent (used by Sprint + Alara for scheduling)

## Installation

```bash
# Install from local path
claude plugin install /path/to/workspace-company-marketplace
```
