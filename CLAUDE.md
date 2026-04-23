# Company Marketplace

Executive suite plugin for Claude Code.

**Inherits from:** User-level CLAUDE.md (~/.claude/CLAUDE.md).

## 1. Quick Reference

| Command | Purpose |
|---------|---------|
| /company:board | Cross-functional strategic decisions (CDO leads) |
| /company:addy | Engineering Lead - delivery, quality, team coordination |
| /company:alara | Product Engineer - design leadership, product strategy |
| /company:sprint | Sprint planning with Addy + Alara classification |
| /company:agent-identity | Load an agent identity from `~/Documents/Workspace/identity/<agent>/`. Used by the Slack messenger harness to boot the messenger agent. |

## 2. Cross-Marketplace Dependencies

| Dependency | Marketplace | Used By |
|-----------|-------------|---------|
| swift, python, typescript agents | workspace-development | Addy (engineering routing) |
| design agents (UX/UI/Motion/System) | workspace-design | Alara (design review routing) |
| linear-service agent | workspace-service | Sprint (current cycle data) |
| life-calendar agent | workspace-life | Sprint + Alara (scheduling) |

## 3. Team Structure

Single source of truth: plugins/company/skills/strategic-framework/team-members.json

## 4. MCP Server

~~Linear Cycles MCP~~ — Removed in v3.1.0. Linear cycle management migrated to `linear-service` agent in workspace-service-marketplace (uses Linear REST API via curl + keychain auth). The `plugins/company/skills/linear-cycles-mcp/` directory remains but is no longer registered as an MCP server.

## 5. Migration Notes

**v4.x.x -- Legacy wrapper to skill migration.** The legacy wrapper agent and cloud-era knowledge skill were removed. The active agent voice and behavior now load through the generic `company:agent-identity` skill, which reads `~/Documents/Workspace/identity/araba/`. The autopilot Slack messenger boots via `/company:agent-identity araba`. Cloud-era references tied to the retired server setup were dropped.
