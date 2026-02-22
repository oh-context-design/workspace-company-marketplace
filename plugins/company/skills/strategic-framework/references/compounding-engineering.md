# Compounding Engineering

**Source:** Dan Shipper, Every | AI & I Conference, December 2024

> "In traditional engineering, each feature makes the next feature harder to build.
> In compounding engineering, your goal is to make sure that each feature makes the next feature easier to build."

---

## Core Methodology

### The Four-Step Loop

```
┌──────────────────────────────────────────────────┐
│                                                  │
│   1. PLAN ─────► 2. DELEGATE ─────► 3. ASSESS   │
│       ▲                                   │      │
│       │                                   ▼      │
│       └────────── 4. CODIFY ◄────────────┘      │
│                  (The Money Step)                │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 1. Plan (Detailed)
Plans should be so detailed an agent can execute without clarification:
- Include edge cases, error handling, success criteria
- Reference existing patterns and CLAUDE.md
- Break complex work into parallelizable chunks

### 2. Delegate (Parallel)
Leverage AI agents for maximum throughput:
- Run 2-4 agents in parallel when work is independent
- Use worktrees for parallel branch work
- "Go investigate" while you do something else
- Managers can commit code with fractured attention

### 3. Assess (Multi-Modal)
Verify work through multiple channels:
- Tests (automated)
- Manual testing (interactive)
- Agent self-review
- Human code review
- Agent code review

### 4. Codify (The Money Step)
Convert tacit knowledge to explicit patterns:
- What did we learn?
- What was harder than expected?
- What pattern would make this easier next time?
- Update CLAUDE.md with new knowledge

---

## Key Metrics

Every stats (Dan Shipper's company):
- **15 people** running **4 software products**
- **99%** of code written by AI agents
- **One developer per app** (production-quality, not toys)
- **Double-digit MRR growth** for 6+ months
- **7,000+ paying subscribers**

---

## Second-Order Effects

### Tacit Code Sharing
Point Claude at another repo to learn their implementation:
- No library abstraction needed
- Re-implement in your own stack/framework
- More developers = more shareable patterns

### Day-One Productivity
New hires are productive immediately:
- CLAUDE.md contains all setup patterns
- Agent sets up local environment
- First PR in hours, not days

### Expert Drop-Ins
Freelancers can contribute on day one:
- Low startup cost
- Agent explains architecture
- Specialists contribute to specific areas

### Cross-Product PRs
Developers submit PRs to other products:
- Find a bug? Fix it and submit PR
- Lightweight review process
- Paper-cut fixes flow naturally

### No Stack Standardization
Teams pick their own tools:
- AI translates between stacks
- Context loading works across languages
- Productivity > consistency

### Managers Can Commit
AI enables fractured attention workflow:
- 10 minutes between meetings → "investigate this bug"
- Back from meeting → review findings, delegate fix
- Before EOD → review PR, submit if clean

---

## The 100% Threshold

> "There's a 10x difference between an org where 90% of engineers use AI versus 100%."

When even 10% use traditional methods:
- Org leans back into traditional workflow
- Can't fully leverage delegation patterns
- Compounding effects are blocked

### Requirements for 100%
- Terminal-first development (Claude Code)
- No one handwriting code
- Parallel agent orchestration standard
- CLAUDE.md as single source of truth

---

## Demo Culture

> "Being a demo culture allows you to do weirder things that you only get if you can feel it."

### Previous World
- Write memo or deck
- Convince people to spend time
- Then build

### AI-Native World
- Vibe code a demo in 2 hours
- Show everyone the thing
- Feel it before committing

### Benefits
- Lower starting energy for experiments
- More experiments = more progress
- Show don't tell
- Validate ideas before investing

---

## AI-Native Operating Principles

1. **Terminal-first** - No code editor, delegation mindset
2. **Parallel by default** - 2-4 agents when work is independent
3. **Codify everything** - Every PR should capture a pattern
4. **Demo over spec** - Show it, don't describe it
5. **One engineer per product** - Default assumption for staffing
6. **Fractured attention is productive** - Short bursts, agent continuity

---

## Application to Agent Architecture

### Addy (Engineering Manager)
- Owns the Compounding Engineering loop
- Facilitates parallel agent orchestration
- Supports demo culture with rapid prototyping
- Manages cross-product collaboration

### Luna (Product Engineer)
- Demo-first workflow for validation
- Velocity vs Craft decision framework
- 2-hour prototype sprint format

### Board
- AI-Native Operating Rhythm
- 100% adoption enforcement
- Compounding review cadence

### CTO
- AI Tooling Radar (Adopt/Trial/Assess/Hold)
- Terminal-first development standards
- Agent autonomy boundaries

---

## Reference

**Talk:** "Dispatch from the Future: Building an AI-Native Company"
**Speaker:** Dan Shipper, CEO of Every
**Event:** AI & I Conference
**Date:** December 2024
**Company:** every.to
