# Company Marketplace

Executive suite plugin for Claude Code.

**Inherits from:** User-level CLAUDE.md (~/.claude/CLAUDE.md).

## 1. Quick Reference

| Command | Purpose |
|---------|---------|
| /company:board | Cross-functional strategic decisions (CDO leads) |
| /company:addy | Engineering Lead - delivery, quality, team coordination |
| /company:alara | Product Engineer - design leadership, product strategy |
| /company:sprint | Sprint planning, Addy + Alara classification, scheduling, and autosprint handoff preparation |
| company:delivery-manager | Manager workflow for visible workers, subagents, check-ins, plan/verify/review/merge/sync/cleanup |
| /company:agent-identity | Load an agent identity from the active session files. Used by the Slack messenger harness to boot the messenger agent. |
| /company:crew-ftax | Guided agent identity creation. Generates SOUL.md, IDENTITY.md, USER.md, CLAUDE.md through Q&A. Moved from `/workspace:crew-ftax` (AGI-23). |

## 2. Cross-Marketplace Dependencies

| Dependency | Marketplace | Used By |
|-----------|-------------|---------|
| swift, python, typescript agents | workspace-development | Addy (engineering routing) |
| design agents (UX/UI/Motion/System) | workspace-design | Alara (design review routing) |
| life-calendar agent | workspace-life | Sprint + Alara (scheduling) |
| agent runtime harness | workspace-agent | Slack messenger boot, autosprint execution, Ghostty task runtime, and agent-inbox-mcp task inbox tools |

## 2.1. Sprint Planning / Autosprint Boundary

Company owns sprint planning, classification, scheduling, and handoff inputs through `/company:sprint`. It may mark Linear tickets with the `autopilot` label when they are approved for autosprint handoff, but it does not launch tasks, manage runtime state, or own PR pipeline behavior.

`autosprint` is the workspace-agent plugin/skill/script that executes sprint tickets. Messenger lifecycle belongs to `agent-messenger`, Ghostty task mechanics belong to `ghostty-tasks`, and task-side inbox tools belong to `agent-inbox-mcp`.

## 2.2. Delivery-Manager

`company:delivery-manager` is the durable manager workflow skill for plan, grooming, worker selection, visible check-ins, verification, review, versioning, merge, sync, and cleanup. It is packaged in Company so Claude Code and Codex can load the same manager contract from the plugin harness instead of relying on a local-only Codex skill copy.

## 3. Team Structure

Single source of truth: plugins/company/skills/strategic-framework/team-members.json
