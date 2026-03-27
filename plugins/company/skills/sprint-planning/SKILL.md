---
name: sprint-planning
description: Sprint operations reference -- biweekly planning ceremonies, velocity tracking, standups, retrospectives, goal alignment, cycle health metrics, and sprint service automation. Use this skill for sprint planning sessions, sprint ceremonies, velocity reports, retrospectives, cycle health checks, or any sprint operational workflow. Also use when checking sprint status, preparing standups, or running the biweekly sprint planning service.
metadata:
  capabilities: sprint-organization, backlog-management, capacity-planning
---

## Actions

**Goal**: Provide operational reference for all sprint ceremonies and the biweekly automated sprint planning service.

**Inputs**:
- Sprint context: active cycle data from Linear, backlog tickets, velocity history
- Goal context: quarterly objectives from Notion (via life-notion agent)
- Calendar context: ritual and learning schedule (work items stay in services.json)

**Steps**:
1. Check Linear for active cycle -- skip if active with > 3 days remaining
2. Pull backlog tickets for in-scope projects from Linear
3. Classify tickets using sprint-master skill (complexity, parallelizability, estimation)
4. Tag autopilot-eligible tickets with `autopilot` label
5. Post sprint plan to #sprint channel with Block Kit formatting
6. After sprint plan posts, invoke life:coach for personal goal planning (rituals, learning, exercise)

**Checks**:
- Active cycle detection prevents duplicate planning mid-sprint
- Velocity trend calculated from last 4 cycles
- Goal alignment validated -- flag sprints with no goal-advancing work
- All channel posts use Block Kit formatting, no plain text

**Stop Conditions**:
- Active sprint has > 3 days remaining -- skip and report
- Linear API unavailable -- report error, do not guess at backlog
- No backlog tickets for in-scope projects -- report empty backlog

**Recovery**:
- If velocity data has fewer than 4 cycles, use available data and note limited history
- If Notion goals unavailable, proceed without goal alignment scoring
- If life:coach invocation fails, complete sprint planning and flag personal planning as skipped

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

### Calendar Sync Scope

Calendar sync is limited to rituals and learning items. Work items are visible through services.json, triage reports, and channel reporting.

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
- Current quarter objectives (detect from date)
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

## 8. Calendar Scope

Calendar events for sprint work are NOT created. Work visibility comes from:
- **services.json** -- execution queue and scheduling
- **Triage reports** -- daily ticket status in #triage
- **Channel reporting** -- sprint plan in #sprint, task updates in #autopilot

Calendar stays reserved for rituals and learning items only. After sprint planning completes, life:coach handles personal goal scheduling (rituals, learning, exercise) which may create calendar events for those categories.

Delegate to **life calendar** agent only for ritual/learning scheduling, never for work items.

---

## 9. Sprint Label Requirements

Sprint tickets use the approved label set from the workspace. Refer to sprint-master skill Section 8 for full autopilot enrichment and label gate requirements.

### Approved Labels (Sprint-Relevant)

| Category | Labels |
|----------|--------|
| Language | `typescript`, `swift`, `python` |
| Project | `portfolio`, `drift`, `viewport`, `design-system`, `oh-context`, `viewport-interactions` |
| Automation | `autopilot` |
| Type | `bug`, `poc` |

### Escalation Labels

| Label | Trigger |
|-------|---------|
| Blocked | External dependency, cannot proceed |
| Needs Human | Ambiguous requirements, human judgment required |

Do not create new labels without Evans's approval. Route language/agent questions to sprint-master skill Section 3 (Team Agent Catalog).

---

## 10. Sprint Service Automation

Automated sprint planning runs as a service in Araba's messenger loop.

### Schedule

- **Frequency:** Biweekly
- **Day:** Sunday
- **Time:** 9:00 PM ET
- **Timezone:** America/New_York

### Ongoing Sprint Detection

Before planning a new sprint, check Linear for an active cycle. If an active cycle exists and has more than 3 days remaining, skip sprint planning for this run. This prevents duplicate planning mid-sprint.

### Execution Steps

1. **Check Linear active cycle** -- Query Linear for current active cycle. If active with > 3 days remaining, skip and report "skipped -- active sprint has N days remaining."
2. **Pull backlog from Linear** -- Fetch backlog tickets for in-scope projects: ViewPort, Portfolio, Drift, Oh Context website, workspace-design-system, Viewport Interactions iOS.
3. **Classify tickets using sprint-master** -- Apply complexity, parallelizability, estimation, and priority scoring from the sprint-master classification reference (Section 1-7).
4. **Tag autopilot-eligible tickets** -- Tickets classified as `ai-parallel` with low or medium complexity get the `autopilot` label in Linear.
5. **Post sprint plan to #sprint** -- Deliver the sprint plan to #sprint channel (C0AP3T4CH2P) using Block Kit formatting. Categorize by project, include estimated hours, and mark autopilot-tagged tickets.
6. **Autopilot pickup** -- Tagged tickets are picked up by the autopilot-sprint service at 9:00 AM weekdays.

### Projects in Scope

| Project | Language | Directory |
|---------|----------|-----------|
| ViewPort | Swift | ~/Documents/Workspace/Viewport |
| Portfolio | TypeScript | ~/Documents/Workspace/Portfolio |
| Drift | Swift | ~/Documents/Workspace/Drift |
| Oh Context | Swift | ~/Documents/Workspace/Oh Context |
| workspace-design-system | TypeScript | ~/Documents/Workspace/workspace-design-system |
| Viewport Interactions | Swift | ~/Documents/Workspace/ViewPort Interactions |

### Guardrails

- Agent type (general-purpose vs language-specific) resolved at runtime by Araba
- Load `workspace:development-pipeline` skill for pipeline order
- No calendar events for work items -- services.json handles visibility
- Block Kit formatting in all channel posts
- No emojis

---

## Cross-Plugin Skills

This skill references skills from other plugins:

| Skill | Plugin | Purpose |
|-------|--------|---------|
| linear-templates | focus | Issue templates for agent routing |
| pr-naming | focus | Branch naming convention |
| sprint-awareness | life | Workload and burnout indicators |
