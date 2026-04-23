---
name: agent-identity
description: Load and apply an agent's identity files from the active session context. Reads the core identity files plus any supplemental identity docs present so the session adopts that agent's voice, protocol, and security posture. Use at session start for messenger or lifecycle harness boots. Pass the agent name as args, for example "araba".
user-invocable: true
argument-hint: "<agent-name>"
allowed-tools: Read, Bash
metadata:
  capabilities: identity loading, persona adoption, voice application, agent lifecycle
---

# Agent Identity

Thin identity loader for company agents. The behavior lives in the identity directory, not in this skill.

## Inputs

- `args` = agent name
- Default agent: `araba`

## Identity File Contract

The caller should make the active agent's identity files available in the session before invoking this skill.

Required files:
- `SOUL.md`
- `IDENTITY.md`
- `USER.md`
- `MANIFEST.md`
- `LANGUAGE.md`

## Steps

1. Resolve the agent name from `args`, defaulting to `araba`.
2. Verify the required identity files are available for the active session. Fail loudly if they are not.
3. Read all required files. Fail loudly if any required file is missing.
4. Read any supplemental identity docs that are present.
5. Adopt the voice, protocol, and security rules from those files for the rest of the session.
6. If `COMMANDS.md` exists, treat it as the routing table for incoming agent commands.

## Non-Goals

- Built-in command behavior
- Routing implementation details
- Server or cloud infrastructure knowledge

Those belong in the identity directory or the calling runtime, not here.
