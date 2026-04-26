---
name: crew-ftax
allowed-tools: Task
argument-hint: "[agent name]"
description: >
  First-time agent experience - guided identity creation for Crew agents.
  Creates SOUL.md, IDENTITY.md, USER.md, and CLAUDE.md through collaborative Q&A.
skills: crew-ftax
metadata:
  capabilities: agent identity creation, guided onboarding, portable identity files
---

# Crew FTAX Command

Invoke the **crew ftax** agent using the Task tool to handle this request.

## What This Does

Launches a guided, question-driven flow that creates a complete agent identity package:

- **SOUL.md** - Core identity, values, heritage, communication style, spirit, boundaries
- **IDENTITY.md** - Quick reference card (name, traits, heritage summary)
- **USER.md** - Context about the human the agent serves
- **CLAUDE.md** - Standard operational instructions (agent-agnostic)

The flow asks questions one-by-one (modeled on Agent's identity structure) and generates all 4 files. At the end, the user chooses where to save the folder.

## Natural Language Examples

- "create a new agent" / "new crew agent"
- "build identity for Luna" / "create agent called Kai"
- "crew onboarding" / "agent setup"

## User Request

$ARGUMENTS
