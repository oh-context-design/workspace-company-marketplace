---
name: araba
description: Araba command router - dispatches subcommands to specialist skills. Use when user types /company:araba or mentions Araba with a subcommand (status, ping, help, pipeline, design, cleanup, sprint, addy, alara, python, coach, finance, gemini, codex). Handles 14 subcommands covering server status, engineering, design, sprint planning, life coaching, and cognitive diversity tools.
user-invocable: true
argument-hint: <subcommand> [args] (e.g., status, sprint, addy build auth)
allowed-tools: Skill, Bash
metadata:
  capabilities: command routing, subcommand dispatch, skill orchestration
---

# Araba Command Router

Araba is the central command router for the workspace. When invoked, parse the first word of the user's input as the subcommand and route to the matching skill. Any remaining text after the subcommand is forwarded as context to the target skill.

## Routing Table

### Built-in Commands (handle directly, no skill invocation)

**status** -- Check the slack-messenger listener status locally.
Run this Bash command and report the result:
```bash
ps aux | grep -i slack-messenger | grep -v grep
```
If the process is running, report active. If not, report inactive. Use ASCII format:
```
● Araba Status
  Messenger: active | inactive
```

**ping** -- Quick health check. Respond immediately:
```
● Araba
  Status: online
  Router: 14 commands available
```

**help** -- List all available subcommands with descriptions:
```
● Araba Commands

  Built-in
    status    Slack messenger status
    ping      Health check
    help      This list

  Routing
    pipeline  Agent delegation pipeline reference
    design    Design review orchestrator
    cleanup   Ship work with git ops + marketplace sync
    sprint    Sprint planning with Addy + Alara
    addy      Engineering Lead
    alara     Product Engineer
    python    Python development orchestrator
    coach     Life coaching orchestrator
    finance   Financial coaching
    gemini    Design analysis via Gemini CLI
    codex     Strategic analysis via Codex CLI
```

### Routed Commands (invoke via Skill tool)

When the subcommand matches one of these, invoke the target skill using the Skill tool. Pass any remaining text after the subcommand as the `args` parameter.

**pipeline** -- Invoke `workspace:agent-pipeline`. Reference guide for agent delegation -- architect, engineer, reviewer workflow.

**design** -- Invoke `design:design-team`. Design review orchestrator that routes to specialist reviewers for web and iOS platforms.

**cleanup** -- Invoke `workspace:cleanup`. Ship work with smart git operations, marketplace sync, and cache management.

**sprint** -- Invoke `company:sprint`. Sprint planning with Addy + Alara classification and calendar scheduling.

**addy** -- Invoke `company:addy`. Engineering Lead -- force multiplier, engineering excellence.

**alara** -- Invoke `company:alara`. Product Engineer -- design leadership, product strategy.

**python** -- Invoke `python:python-team`. Python development orchestrator -- routes to architect, engineer, and reviewers.

**coach** -- Invoke `life:coach`. Life coaching orchestrator with Atomic Habits + Altman principles.

**finance** -- Invoke `life:finance`. Financial coaching with Atomic Habits -- budget tracking, debt payoff, micro-savings.

**gemini** -- Invoke `workspace:gemini`. Design analysis via Google Gemini CLI for cognitive diversity.

**codex** -- Invoke `workspace:codex`. Strategic analysis via OpenAI Codex CLI for cognitive diversity.

## Unrecognized Commands

If the subcommand does not match any entry above, respond with:
```
✗ Unknown command: <subcommand>
  Type /company:araba help for available commands.
```

## No Subcommand

If invoked without arguments, run the **help** command.
