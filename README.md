# workspace-company-marketplace

Executive suite marketplace for Claude Code and Codex. Provides board orchestration, engineering lead (Addy), product engineer (Alara), sprint planning/classification/scheduling, Delivery-Manager workflow coordination, and generic agent identity loading.

## Plugin

| Plugin | Commands | Description |
|--------|----------|-------------|
| company | `/company:board`, `/company:addy`, `/company:alara`, `/company:sprint`, `/company:crew-ftax`, `/company:agent-identity <agent>` | Executive suite with strategic decision-making, sprint planning and autosprint handoff preparation, Delivery-Manager workflow coordination, identity loading for messenger boots, and Crew FTAX identity creation |

## Requirements

- Claude Code CLI
- `LINEAR_API_KEY` in macOS Keychain (resolved at runtime via Keychain Resolver MCP, for sprint/cycle planning features)

## Cross-Marketplace Dependencies

This marketplace references agents from other marketplaces:

- **workspace-development** - Swift, Python, TypeScript specialist agents (used by Addy for engineering routing)
- **workspace-design** - UX/UI/Motion/System design reviewers (used by Alara for design review routing)
- **workspace-service** - linear-service agent (used by Sprint for current cycle data), life-calendar agent (used by Sprint + Alara for scheduling)
- **workspace-agent** - autosprint execution/runtime owner; Company only prepares sprint plans, classifications, and handoff inputs

## Installation

```bash
# Install from local path
claude plugin install /path/to/workspace-company-marketplace

# Register the Codex marketplace, then install from Codex's plugin UI/CLI flow
codex plugin marketplace add oh-context-design/workspace-company-marketplace
```
