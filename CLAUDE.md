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
| /company:agent-identity | Load an agent identity from the active session files. Used by the Slack messenger harness to boot the messenger agent. |
| /company:crew-ftax | Guided agent identity creation. Generates SOUL.md, IDENTITY.md, USER.md, CLAUDE.md through Q&A. Moved from `/workspace:crew-ftax` (AGI-23). |

## 2. Cross-Marketplace Dependencies

| Dependency | Marketplace | Used By |
|-----------|-------------|---------|
| swift, python, typescript agents | workspace-development | Addy (engineering routing) |
| design agents (UX/UI/Motion/System) | workspace-design | Alara (design review routing) |
| life-calendar agent | workspace-life | Sprint + Alara (scheduling) |
| agent runtime harness | workspace-agent | Slack messenger boot, autosprint execution, Ghostty task runtime, and task inbox IPC |

## 2.1. Autopilot Naming Boundary

In this marketplace, `autopilot` normally refers to historical/external planning concepts: the Linear label, the `#autopilot` Slack channel, and sprint ticket eligibility language. Keep those names unchanged.

Use `autosprint` only when referring to the workspace-agent plugin/skill/script that executes sprint work. Messenger lifecycle belongs to `agent-messenger`, Ghostty task mechanics belong to `ghostty-tasks`, and task-side inbox tools belong to `task-ipc-mcp`.

## 3. Team Structure

Single source of truth: plugins/company/skills/strategic-framework/team-members.json
