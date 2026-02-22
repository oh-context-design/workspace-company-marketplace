---
name: sprint-master
description: Issue classification reference - complexity, parallelizability, team routing, estimation. Use when classifying sprint issues.
metadata:
  capabilities: sprint-leadership, team-coordination, sprint-execution
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

# Sprint Master Classification Reference

Reference data for classifying sprint issues. Provides complexity definitions, parallelizability categories, team agent routing, and estimation guidelines.

---

## 1. Complexity Definitions

### Low Complexity (2-4 hours)
- Bug fixes with clear reproduction steps
- Simple refactors with isolated impact
- Documentation updates
- Configuration changes
- Test additions for existing functionality

### Medium Complexity (4-8 hours)
- Standard features with defined requirements
- API integrations with documented endpoints
- UI components following existing patterns
- Multi-file changes with predictable impact
- Database migrations with rollback plans

### High Complexity (8-16 hours)
- Architecture decisions requiring research
- Security-critical implementations
- Complex state management
- Cross-cutting concerns affecting multiple systems
- Performance optimizations requiring profiling

---

## 2. Parallelizability Categories

### ai-parallel
Tasks that agents can handle independently without human oversight.

**Characteristics:**
- Clear specifications with testable outcomes
- No ambiguous requirements
- Follows established patterns

**Examples:**
- Boilerplate generation
- Test writing with clear specs
- Documentation updates
- Bug fixes with clear repro steps
- Linting/formatting cleanup
- Type annotations

### human-ai (Collaborative)
Tasks requiring human and AI collaboration throughout.

**Characteristics:**
- Standard complexity with some judgment calls
- May need mid-task clarification
- Design checkpoints recommended

**Examples:**
- Standard feature implementation
- API integrations
- UI component development
- Database schema changes
- Configuration system updates

### human-required
Tasks requiring significant human judgment and oversight.

**Characteristics:**
- Ambiguous requirements needing interpretation
- Security or privacy implications
- Architectural impact
- User-facing decisions

**Examples:**
- Architecture decisions
- Security-critical code
- Complex state management
- Performance-critical paths
- User experience flows
- API design decisions

---

## 3. Team Agent Catalog

Reference: `team-members.json` for complete structure.

### Engineering Teams (Reports to Addy)

| Plugin | Agents | Focus |
|--------|--------|-------|
| Swift | swift-architect, swift-engineer, swift-code-reviewer, swift-security-reviewer | iOS/SwiftUI |
| Python | python-architect, python-engineer, python-code-reviewer, python-security-reviewer | Tooling, MCP |
| TypeScript | typescript-architect, typescript-engineer, typescript-code-reviewer, typescript-security-reviewer | Web, Next.js |

### Design Reviewers (Reports to Alara)

| Agent | Focus |
|-------|-------|
| design-ux-reviewer | User flows, information architecture |
| design-ui-web-reviewer | Accessibility, semantic HTML, React |
| design-motion-reviewer | Animation timing, physics, performance |
| design-system-web-reviewer | Tokens, Tailwind, visual consistency |
| design-swift-ui-reviewer | SwiftUI implementation, iOS HIG |
| design-swift-ux-reviewer | iOS navigation, user flows |
| design-swift-motion-reviewer | Springs, transitions, 60fps |
| design-swift-system-reviewer | iOS tokens, Dynamic Type |

### Escalation Paths

| Situation | Route To |
|-----------|----------|
| Engineering questions | Addy → CTO (if escalated) → Board |
| Design questions | Alara → CDO (if escalated) → Board |
| Product strategy | Alara → Board |
| Cross-functional conflicts | Addy + Alara → Board |
| Complex sprint decisions | Sprint → Addy + Alara → Board |

---

## 4. Estimation Guidelines

### Estimation Matrix

| Complexity | ai-parallel | human-ai | human-required |
|------------|-------------|----------|----------------|
| Low | 2h | 3h | 4h |
| Medium | 4h | 6h | 8h |
| High | 8h | 12h | 16h |

### Estimation Heuristics

1. **Start with complexity** - Assess scope and technical difficulty
2. **Apply parallelizability multiplier** - Human involvement adds overhead
3. **Add context-switching buffer** - +25% for multi-day tasks
4. **Consider dependencies** - Blocked issues need buffer

### Example Classifications

| Issue | Complexity | Parallelizable | Estimate |
|-------|------------|----------------|----------|
| Fix typo in README | Low | ai-parallel | 2h |
| Add form validation | Medium | human-ai | 6h |
| Implement OAuth flow | High | human-required | 16h |
| Update API documentation | Low | ai-parallel | 2h |
| Build chart component | Medium | human-ai | 6h |

---

## 5. Weekend Flexibility Rules

### weekendOk: false
Apply when:
- Issue blocks other critical path work
- Part of a dependency chain with weekday deadlines
- Requires synchronous collaboration
- Time-sensitive (external dependency, launch date)

### weekendOk: true
Apply when:
- Issue is independent (no blockers, not blocking)
- Stretch goal that can slip without impact
- Research or exploration task
- Nice-to-have improvement

### Critical Rule
**Never** create dependency chains where weekend work blocks weekday work.

**Bad Pattern:**
```
Mon: WOR-100 (blocked by WOR-101)
Sat: WOR-101 (weekendOk: true)  ← WRONG: blocks Monday work
```

**Good Pattern:**
```
Mon-Thu: WOR-100 (critical path)
Sat: WOR-102 (independent stretch) ← OK: no dependencies
```

---

## 6. Priority Framework

### Addy Lens (Engineering)
Evaluates from technical perspective:
- **Complexity**: How hard is this to build?
- **Dependencies**: What does this block/depend on?
- **Technical debt**: Does this reduce or add debt?
- **Execution order**: What's the optimal build sequence?

### Alara Lens (Design/Product)
Evaluates from product perspective:
- **User impact**: How many users benefit?
- **Design complexity**: How much design work needed?
- **Review checkpoints**: Where do we need approval?
- **Goal alignment**: Does this advance our objectives?

### Combined Priority Score

```
Priority = (UserImpact × 3) + (TechnicalUrgency × 2) + (DependencyScore × 2) + (GoalAlignment × 1)
```

| Score Range | Priority Level |
|-------------|----------------|
| 20+ | Urgent (do first) |
| 15-19 | High |
| 10-14 | Normal |
| < 10 | Low (stretch goal) |

---

## 7. Classification Output Schema

Return this JSON structure for each classified issue:

```json
{
  "issueId": "WOR-123",
  "title": "Issue title",
  "complexity": "low|medium|high",
  "parallelizable": "ai-parallel|human-ai|human-required",
  "estimateHours": 6,
  "suggestedAgent": "typescript-engineer",
  "weekendOk": false,
  "dependencies": ["WOR-120", "WOR-121"],
  "goalAlignment": "Q1 Goal: Ship auth feature",
  "notes": "Needs design review checkpoint"
}
```

### Field Definitions

| Field | Type | Description |
|-------|------|-------------|
| issueId | string | Linear issue identifier |
| title | string | Issue title |
| complexity | enum | low, medium, high |
| parallelizable | enum | ai-parallel, human-ai, human-required |
| estimateHours | number | Estimated hours to complete |
| suggestedAgent | string | Primary agent to assign |
| weekendOk | boolean | Can be stretch goal |
| dependencies | string[] | Blocking issue IDs |
| goalAlignment | string | Which goal this advances |
| notes | string | Additional context |

### Batch Output

When classifying multiple issues:

```json
{
  "classification": [
    { "issueId": "WOR-123", "..." },
    { "issueId": "WOR-124", "..." }
  ],
  "totalHours": 16,
  "weekdayHours": 12,
  "weekendStretch": 4,
  "notes": "WOR-123 blocks WOR-124"
}
```
