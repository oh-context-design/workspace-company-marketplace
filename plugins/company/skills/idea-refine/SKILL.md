---
name: idea-refine
description: >
  Interrogate vague development ideas to surface constraints, goals, and success criteria before any spec or implementation begins. Stops premature building.
user-invocable: false
allowed-tools: Read, AskUserQuestion
metadata:
  capabilities: idea interrogation, constraint surfacing, goal clarification, scope boundary definition
---

**Purpose:** Stop premature building. Before writing any spec or code, surface what's actually being asked.

**Rationalizations (why this step matters):**
| Practice | Why | Anti-pattern |
|----------|-----|--------------|
| Interrogate before specifying | Vague ideas become costly mid-build pivots | Jumping straight to spec |
| Surface constraints early | Hidden constraints invalidate specs | Discovering blockers in implementation |
| Define success criteria | "Done" is ambiguous without them | Shipping and then realizing it's wrong |

**Questions to ask (structured sequence, one at a time):**
1. What problem does this solve? (Not what does it do — what pain does it remove?)
2. Who experiences this problem? (User, system, business process?)
3. What does success look like? (Observable outcome, not implementation detail)
4. What constraints exist? (Time, tech stack, dependencies, non-negotiables)
5. What is explicitly out of scope?
6. What's the simplest version that delivers value?

**Red flags:**
- Request jumps to implementation details before the problem is clear
- "Success" is described by features, not outcomes
- No known constraints ("whatever works")
- Scope is open-ended ("and eventually...")

**Output:** A brief idea summary covering problem statement, target user, success criteria, constraints, out-of-scope, and MVP definition. Hand off to spec-driven-development.

**Handoff:** Once the idea is clear → `spec-driven-development`
