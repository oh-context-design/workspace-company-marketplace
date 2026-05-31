---
name: spec-driven-development
description: >
  Turn a defined idea into an actionable spec with acceptance criteria, interface contracts, and test cases. The output drives TDD without ambiguity.
user-invocable: false
allowed-tools: Read, Write
metadata:
  capabilities: spec writing, acceptance criteria, interface contracts, test case definition, TDD input
---

**Purpose:** Produce a spec that engineers can implement against without interpretation. No ambiguity = no rework.

**Rationalizations:**
| Practice | Why | Anti-pattern |
|----------|-----|--------------|
| Write spec before code | Spec forces precision; code forces compromise | Discovering interface problems mid-implementation |
| Acceptance criteria first | Tests become obvious to write | Tests written after, covering what was built not what was needed |
| Interface contracts early | Consumers and producers can work independently | Interface discovered through code reading |

**Spec format:**
```
## Spec: [Name]

**Problem:** [One sentence from idea-refine]
**Success criteria:** [Observable outcomes, 3-5 bullets]

## Interface Contract
[Input types, output types, error cases — language-appropriate signatures]

## Acceptance Tests (language-agnostic)
[ ] Given [state], when [action], then [outcome]
[ ] Edge case: [scenario]
[ ] Error case: [scenario]

## Out of scope
- [Explicit exclusions]
```

**Red flags:**
- Acceptance criteria describe implementation, not behavior
- No error cases defined
- Interface uses vague types (any, object, string without constraints)
- Out-of-scope section is empty

**Output:** A complete spec document. Hand off to engineering team lead.

**Handoff:** Complete spec → route to `/typescript:typescript-team`, `/swift:swift-team`, or `/python:python-team`
