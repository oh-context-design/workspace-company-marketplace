---
name: araba
allowed-tools: Task
argument-hint: natural language request
description: Interact with Araba's server - check status, pull data, update files
metadata:
  capabilities: server management, data retrieval, file updates, AI assistant interaction
---

# Araba Orchestrator

Routes requests to the Araba agent for interacting with your personal AI assistant's server.

## How to Route

When the user wants to check Araba's status, health, or service state, invoke the **araba agent** to check the server.

When the user wants to pull data from Araba (devotionals, notes, journals), invoke the **araba agent** to SSH and retrieve files.

When the user wants to update Araba's files (SOUL.md, skills, AGENTS.md), invoke the **araba agent** with the changes.

When the user asks about Araba's capabilities or how she works, invoke the **araba agent** to explain from the knowledge skill.

## Delegation

Use the Task tool with **araba agent**. Pass the complete user request.

## User Request

$ARGUMENTS
