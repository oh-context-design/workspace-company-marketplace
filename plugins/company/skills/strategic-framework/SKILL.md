---
name: strategic-framework
description: >
  Executive decision-making frameworks for strategic product and business decisions.
  Contains Tim Cook and Jeff Bezos leadership philosophies, Technology Radar and build-vs-buy
  evaluation models, NPV/IRR/RICE financial scoring, Jony Ive and Dieter Rams design principles,
  and indie app marketing strategies. Reference knowledge base for CEO, CTO, CFO, CDO, and Board agents.
user-invocable: false
context: fork
metadata:
  capabilities: strategic-decision-making, business-strategy, decision-frameworks
---

## Actions

**Goal**: Single sentence description of what this skill provides or enables.

**Inputs**:
- Description of what the user or calling agent provides

**Steps**:
1. First atomic step
2. Second atomic step
3. Third atomic step (if applicable)

**Checks**:
- Verification that output is correct
- Any assertions or validations

**Stop Conditions**:
- When to stop and ask the user for clarification
- When to request additional information

**Recovery**:
- How to handle errors gracefully
- Fallback strategies if primary approach fails

---

# Strategic Framework Skill

Executive decision-making frameworks and leadership philosophies for the Company plugin.

## Usage

This skill provides embedded knowledge for CEO, CTO, CFO, CDO, and Board agents. Load the appropriate reference file based on the executive role.

## Reference Files

| File | Purpose | Used By |
|------|---------|---------|
| `references/ceo-leadership.md` | Tim Cook, Dylan Field, Jeff Bezos DNA | CEO Agent |
| `references/cto-frameworks.md` | Technology Radar, Build vs Buy, Tech Debt | CTO Agent |
| `references/cfo-financial.md` | NPV, IRR, ROI, RICE scoring | CFO Agent |
| `references/cdo-design.md` | Jony Ive, Dieter Rams principles | CDO Agent |
| `references/decision-frameworks.md` | SWOT, OKRs, OODA, Eisenhower | All Agents |
| `references/indie-marketing.md` | Vibe marketing, paid acquisition, email lists | CEO, Board |

## Loading Pattern

```
Read: plugins/company/skills/strategic-framework/references/ceo-leadership.md
```

Agents should load their relevant reference file(s) when activated to access the embedded knowledge base.
