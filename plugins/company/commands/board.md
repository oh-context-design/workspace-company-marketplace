---
name: board
description: Cross-functional strategic decisions - convenes CEO, CTO, CFO, CDO
argument-hint: strategy, decisions, executive
allowed-tools: Task, Read
metadata:
  capabilities: executive decision-making, strategic analysis, cross-functional perspectives, market strategy, financial planning
---

The Board agent analyzes the question and routes to appropriate executives:
- CEO for strategy and market questions
- CTO for technology and architecture questions
- CFO for financial and investment questions
- CDO for design and UX questions
- Luna for product strategy questions

For cross-functional questions, the Board convenes multiple executives and synthesizes their perspectives into a unified recommendation.

Pass the full user request to the agent for cross-functional analysis.

Use the Task tool to invoke the **company board** agent with the user's request.


$ARGUMENTS