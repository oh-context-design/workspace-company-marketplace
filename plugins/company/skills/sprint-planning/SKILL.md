---
name: sprint-planning
description: Sprint operations reference - velocity tracking, standups, retrospectives, goal alignment, calendar sync. Use for sprint ceremonies.
metadata:
  capabilities: sprint-organization, backlog-management, capacity-planning
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

# Sprint Planning Operations Reference

Reference data for sprint operations. Provides velocity calculation, standup structure, retrospective patterns, goal alignment, and calendar integration formats.

---

## 1. Sprint Goals + Notion Integration

### Goal Hierarchy

```
Yearly Goals (Vision)
    ↓
Quarterly Goals (OKRs)
    ↓
Sprint Goals (Deliverables)
    ↓
Issues (Tasks)
```

### Goal Alignment Validation

When classifying issues, flag if:
- Issue has no alignment to quarterly goal
- Sprint has no issues advancing a quarterly goal
- Goal drift detected (work doesn't match stated objectives)

### 6 Life Domains Coverage

Reference from life plugin. Ensure personal sprints balance:
1. **Career** - Professional growth, skills
2. **Relationships** - Family, friends, community
3. **Health** - Physical, mental wellness
4. **Meaning** - Purpose, spiritual growth
5. **Finances** - Savings, investments, security
6. **Fun** - Hobbies, recreation, rest

### Notion Sync Pattern

Delegate goal operations to **life notion** agent:

```markdown
## Goal Sync Request

Pull quarterly goals from Notion:
- Current Q1 2026 objectives
- Progress metrics
- Related sprint issues

Update goal progress after sprint completion.
```

---

## 2. Velocity Calculation

### Formula

```
Velocity = avg(last 4 cycles completed points)
```

### Tracking Method

| Metric | Calculation |
|--------|-------------|
| Cycle velocity | Sum of completed issue points |
| Rolling average | (V1 + V2 + V3 + V4) / 4 |
| Trend | Compare current to average |

### Trend Indicators

| Symbol | Meaning | Threshold |
|--------|---------|-----------|
| ↑ | Improving | Current > avg + 10% |
| → | Stable | Within ±10% of avg |
| ↓ | Declining | Current < avg - 10% |

### Points vs Hours

| Method | Use When |
|--------|----------|
| Points | Team uses story points, abstract estimation |
| Hours | Direct time tracking, solo work |

Convert: `1 point ≈ 4 hours` (adjust per team calibration)

---

## 3. Daily Standup Structure

### Format: Yesterday / Today / Blockers

```markdown
## Standup: [Date]

### Yesterday
- [What was completed]
- [Progress on in-flight items]

### Today
- [Planned focus items]
- [Expected completions]

### Blockers
- [What's stuck]
- [What needs escalation]
```

### Tracking Metrics

| Metric | Target |
|--------|--------|
| Progress % | Issues moved forward |
| Capacity | Hours available today |
| Risks | Items at risk of slipping |

### Time Box

**Duration**: 15 minutes maximum

If standup exceeds 15 min:
1. Note overflow topics
2. Schedule separate discussion
3. Keep standup moving

### Output

- Updated issue statuses in Linear
- Blocker escalation (add "Blocked" label)
- Calendar adjustments if needed

---

## 4. Friday Focus Pattern

### Purpose

Prepare for concentrated deep work on highest-priority item.

### Execution

1. **Identify**: Pull highest-priority Portfolio issue
2. **Block Time**: Recommend 2-4 hour focused blocks
3. **Prep Context**: Gather all needed information

### Context Prep

```markdown
## Friday Focus: [Issue Title]

### Issue Details
- Linear: [URL]
- Priority: [Score]
- Estimate: [Hours]

### Dependencies
- [What must be done first]
- [What this unblocks]

### Files to Modify
- [List of affected files]

### References
- [Related documentation]
- [Similar implementations]
```

### Time Blocking Recommendations

| Duration | Use For |
|----------|---------|
| 2h block | Medium complexity, clear scope |
| 3h block | High complexity, exploration needed |
| 4h block | Deep work, architecture decisions |

---

## 5. Weekly Retrospective Pattern

### Format: Completed / Blocked / Lessons

```markdown
## Retrospective: Week of [Date]

### Completed
- [What shipped]
- [Evidence: PRs merged, issues closed]

### Blocked
- [What stalled]
- [Why it stalled]
- [Resolution path]

### Lessons
- [What to improve]
- [Process changes]
- [Tool adjustments]
```

### Notion Goal Check

Delegate to **life notion** agent:

```markdown
## Goal Check Request

1. Pull quarterly/yearly goals from Notion
2. Compare sprint completions to goal objectives
3. Report:
   - Goals advanced this sprint
   - Goals with no progress
   - Goal drift indicators
```

### Goal Drift Detection

Flag when:
- Sprint work doesn't map to any stated goal
- High-priority goals have no sprint issues
- More than 30% of work is unplanned

### Output Format

```json
{
  "weekOf": "2026-01-13",
  "completed": {
    "issues": 5,
    "points": 21,
    "highlights": ["Shipped auth feature", "Fixed critical bug"]
  },
  "blocked": {
    "issues": 1,
    "reasons": ["Waiting on API access"]
  },
  "goalAlignment": {
    "Q1 Goal: Auth": "Advanced (3 issues)",
    "Q1 Goal: Performance": "No progress"
  },
  "lessons": ["Need earlier API key requests"]
}
```

---

## 6. Cycle Health Metrics

### Completion Percentage

```
Completion % = (completed / total) × 100
```

### Issue Breakdown

| Status | Meaning |
|--------|---------|
| Todo | Not started |
| In Progress | Actively worked |
| In Review | Awaiting review |
| Done | Completed |
| Blocked | Cannot proceed |

### Days Remaining

```
Days Remaining = Cycle End Date - Today
```

### Health Status

| Status | Indicator | Condition |
|--------|-----------|-----------|
| On track | ● | Completion % ≥ expected for day |
| At risk | ◐ | Completion 10-20% behind expected |
| Behind | ✗ | Completion > 20% behind expected |

### Expected Progress Formula

```
Expected % = (Elapsed Days / Total Days) × 100
Actual % = (Completed / Total) × 100
Gap = Expected % - Actual %
```

---

## 7. Sprint Awareness Integration

Reference: life plugin `sprint-awareness` skill

### Weighted Hours

| Work Type | Multiplier | Reason |
|-----------|------------|--------|
| deep-work | 1.5x | High cognitive load |
| human-focus | 1.0x | Standard effort |
| ai-parallel | 0.5x | Can delegate to agents |

### Intensity Levels

| Level | Hours/Week | Sustainability |
|-------|------------|----------------|
| Light | < 20h | Highly sustainable |
| Moderate | 20-30h | Sustainable |
| High | 30-40h | Short-term OK |
| Crunch | > 40h | Burnout risk |

### Burnout Risk Indicators

- 3+ consecutive high-intensity sprints
- No weekends with `weekendOk: false` items
- Blocked issues not clearing
- Velocity declining trend (↓)

---

## 8. Calendar Event Format

When creating calendar events for sprint work:

```json
{
  "summary": "[PROJECT] Issue title",
  "description": "Linear: [URL]\nClassified by: Addy + Alara",
  "colorId": "[based on work type]",
  "extendedProperties": {
    "private": {
      "syncSource": "sprint-planner",
      "linearIssueId": "[uuid]",
      "workType": "[ai-parallel|human-focus|deep-work]"
    }
  }
}
```

### Color Mapping

| Work Type | Color ID | Meaning |
|-----------|----------|---------|
| deep-work | 11 (red) | Critical, focus time |
| human-focus | 5 (yellow) | Standard work |
| ai-parallel | 2 (green) | Can delegate |
| blocked | 8 (gray) | Waiting |

### Calendar Delegation

Delegate to **life calendar** agent for:
- Creating sprint work blocks
- Checking availability
- Updating event status

---

## 9. Agent Labels System

### Language Detection Labels

| Pattern | Language | Labels |
|---------|----------|--------|
| `*.swift`, `/ios/` | Swift | Swift Architect/Engineer/Code Reviewer/Security Reviewer |
| `*.ts`, `*.tsx` | TypeScript | TypeScript Architect/Engineer/Code Reviewer/Security Reviewer |
| `*.py`, `/scripts/` | Python | Python Architect/Engineer/Code Reviewer/Security Reviewer |

### Design Review Labels

| Agent | When to Apply |
|-------|---------------|
| UX Reviewer | User flows, navigation changes |
| UI Web Reviewer | Web components, accessibility |
| UI iOS Reviewer | SwiftUI views, iOS HIG |
| Motion Reviewer | Animations, transitions |
| System Reviewer | Design tokens, consistency |

### Escalation Labels

| Label | Meaning | Trigger |
|-------|---------|---------|
| Addy | Engineering review needed | Technical complexity high |
| Alara | Product review needed | Scope unclear, design decision |
| Needs Human | Human judgment required | Ambiguous requirements |
| Blocked | Cannot proceed | External dependency |

### Label Application Rules

1. **Primary label**: Language + role (e.g., "TypeScript Engineer")
2. **Design labels**: Add if UI/UX affected
3. **Escalation labels**: Add when conditions met
4. **Remove labels**: When phase completes, remove old labels

---

## Cross-Plugin Skills

This skill references skills from other plugins:

| Skill | Plugin | Purpose |
|-------|--------|---------|
| linear-templates | focus | Issue templates for agent routing |
| pr-naming | focus | Branch naming convention |
| sprint-awareness | life | Workload and burnout indicators |
