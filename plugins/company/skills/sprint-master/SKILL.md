---
name: sprint-master
description: Sprint issue classification reference -- complexity tiers, parallelizability categories, team routing, estimation matrix, autopilot enrichment, and priority scoring. Use this skill whenever classifying Linear tickets for sprints, estimating work, deciding autopilot eligibility, or routing issues to agents. Also use when someone asks about issue complexity, sprint capacity, or work categorization.
metadata:
  capabilities: sprint-leadership, team-coordination, sprint-execution
---

## Actions

**Goal**: Classify sprint issues by complexity, parallelizability, and priority, then produce structured JSON output for sprint planning.

**Inputs**:
- Linear issues (backlog or cycle tickets) for classification
- Optional: Notion goals for alignment scoring
- Optional: Team availability for capacity checks

**Steps**:
1. Assess each issue's complexity tier (low/medium/high) using Section 1 definitions
2. Determine parallelizability category (ai-parallel/human-ai/human-required) using Section 2
3. Apply estimation matrix from Section 4 to produce hour estimates
4. Score priority using the combined formula from Section 6
5. Check autopilot eligibility using Section 8 enrichment checklist
6. Return structured JSON per Section 7 output schema

**Checks**:
- Every issue has complexity, parallelizability, and estimate populated
- No weekend work blocks weekday critical path (Section 5)
- Autopilot-tagged tickets have required labels, acceptance criteria, and estimates
- Priority scores calculated consistently across batch

**Stop Conditions**:
- Issue requirements are ambiguous -- flag as human-required and note the ambiguity
- Missing project context needed for language inference
- Conflicting dependencies that need human resolution

**Recovery**:
- If Linear data is incomplete, classify what is available and list gaps
- If priority scoring inputs are missing, use complexity + parallelizability as fallback ranking
- Default to human-ai when parallelizability is unclear

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

> **Note:** Agent routing (general-purpose vs language-specific engineers) is determined at execution time by Araba based on current operational state. Refer to `workspace:development-pipeline` for the pipeline order.

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
  "suggestedAgent": "typescript engineer",
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
| suggestedAgent | string | Language + role (e.g., "typescript engineer"); agent type resolved at runtime by Araba |
| weekendOk | boolean | Can be stretch goal |
| dependencies | string[] | Blocking issue IDs |
| goalAlignment | string | Which goal this advances |
| notes | string | Additional context |

---

## 8. Autopilot Enrichment Checklist

Reference for auditing tickets against autopilot eligibility requirements.

### Label Gate

Every autopilot-eligible ticket MUST have:

| Label Type | Valid Values | Required |
|-----------|-------------|----------|
| Language | `typescript`, `python`, `swift` | Yes |
| Project | `portfolio`, `drift`, `viewport`, `design-system`, `oh-context`, `viewport-interactions` | Yes |
| Automation | `autopilot` | Yes (for opt-in) |

### Description Gate

Ticket description MUST contain acceptance criteria in one of these forms:
- Heading: `## Acceptance Criteria` or `## AC`
- Checkbox list: `- [ ] criteria item`
- Numbered requirements: `1. requirement`

Minimum: 2 acceptance criteria items.

### Estimate Gate

Ticket MUST have a Linear estimate set. Use the estimation matrix from Section 4 to propose values.

### Language Inference Table

When a ticket has a project label but no language label, infer language:

| Project Label | Inferred Language |
|--------------|-------------------|
| `portfolio` | `typescript` |
| `drift` | `swift` |
| `viewport` | `swift` |
| `design-system` | `typescript` |
| `oh-context` | `swift` |
| `viewport-interactions` | `swift` |

### Enrichment Output Schema

```json
{
  "issueId": "WOR-240",
  "identifier": "WOR-240",
  "title": "Issue title",
  "status": "ready | needs-enrichment",
  "missing_labels": ["typescript"],
  "missing_estimate": true,
  "missing_acceptance_criteria": false,
  "proposed_labels": ["typescript"],
  "proposed_estimate": 4,
  "notes": "Language inferred from project label 'portfolio'"
}
```

---

## 9. Development Pipeline Integration

All ticket execution follows the `workspace:development-pipeline` skill as the canonical pipeline order. This applies to both manual and autopilot ticket execution.

### Pipeline Order

1. **Codex reviewer** -- reviews ticket context, Slack threads, and supporting information
2. **Language architect** -- reviews Codex output, designs implementation approach
3. **Engineer** -- implements using TDD (red/green cycle)
4. **Code reviewer** -- reviews implementation for quality, patterns, and standards
5. **Security reviewer** -- reviews for vulnerabilities, secret exposure, and access control
6. **PR creation** -- branch, commit, push, and open PR with full context

### Key Rules

- Agent type (general-purpose vs language-specific) resolved at runtime by Araba
- Load `workspace:development-pipeline` skill for pipeline order
- Each pipeline step produces artifacts consumed by the next step
- If any step fails, fix and re-run that step before proceeding

---

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
