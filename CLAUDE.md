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
| /company:araba | Personal AI assistant server operations |

## 2. Cross-Marketplace Dependencies

| Dependency | Marketplace | Used By |
|-----------|-------------|---------|
| swift, python, typescript agents | workspace-development | Addy (engineering routing) |
| design agents (UX/UI/Motion/System) | workspace-design | Alara (design review routing) |
| focus-linear agent | workspace-life | Sprint (current cycle data) |
| life-calendar agent | workspace-life | Sprint + Alara (scheduling) |

## 3. Team Structure

Single source of truth: plugins/company/skills/strategic-framework/team-members.json

## 4. MCP Server

Linear Cycles MCP: plugins/company/skills/linear-cycles-mcp/dist/index.js
Build: cd plugins/company/skills/linear-cycles-mcp && bun run build
Auth: reads LINEAR_API_KEY from keychain (ohcontext-linear-api-key)
