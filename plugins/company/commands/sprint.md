---
name: sprint
description: Sprint planning with Addy + Alara classification and calendar scheduling
argument-hint: plan, review, status, velocity
allowed-tools: Task
metadata:
  capabilities: sprint planning, issue classification, specialist assessment, calendar scheduling, velocity tracking
---

# Sprint Command

Orchestrates sprint planning by gathering data, classifying issues, and coordinating specialist assessments. The command handles all Task orchestration since subagents cannot spawn other subagents.

## Routing

Detect intent from the user's request and route accordingly:

- **Planning requests** ("plan", "sunday planning", "set up the week") run the full orchestration workflow below.

- **Friday requests** ("friday", "friday focus", "dev session") → Task → **company sprint** agent for focused session setup.

- **Review requests** ("review", "weekly", "retrospective") → Task → **company sprint** agent for weekly retrospective.

- **Status/velocity/cycle management** → Task → **company sprint** agent for quick operations.

---

## Plan Operation Workflow

For planning requests, the command orchestrates all phases:

**Phase 1: Data Gathering**

Issue both Task calls in the SAME message:

1. Task → **focus linear** agent
   - subagent_type: focus:focus-linear
   - prompt: "Get current cycle issues for Workspace team. Return: issue ID, title, description, status, labels, estimate."

2. Task → **life calendar** agent
   - subagent_type: life:life-calendar
   - prompt: "Get weekly calendar overview for the current week. Include protected blocks and existing commitments."

**Phase 2: Propose Sprint Goals (Goals Only)**

Analyze tickets and propose 2-3 sprint goals. DO NOT classify issues yet.

3. Task → **company sprint** agent
   - subagent_type: company:company-sprint
   - prompt: "Analyze these issues and propose 2-3 sprint goals ONLY. Do NOT classify issues yet - that happens after user confirms goals. Sprint goals are short-term themes for this 2-week period (e.g., 'Ship auth feature', 'Clear critical bugs'). Return: goal name, which issues align, and brief rationale."

**Phase 3: User Confirms Goals (HARD STOP)**

Present proposed sprint goals and ask:
1. Accept these goals?
2. Adjust/add goals?
3. Skip goal-setting and proceed with all issues

**CRITICAL: Do NOT proceed to Phase 4 until user responds.** This is a mandatory checkpoint.

**Phase 4: Classification + Specialist Assessment (Parallel)**

After user confirms goals, issue ALL THREE Task calls in the SAME message:

4. Task → **company sprint** agent (classification)
   - subagent_type: company:company-sprint
   - prompt: "Given sprint goals: [confirmed goals]. Classify these issues: [issues from Phase 1]. For each issue, return: alignment to goals, complexity, parallelizable, estimate hours, suggested agent, weekend vs weekday."

5. Task → **company addy engineering lead** agent
   - subagent_type: company:company-addy-engineering-lead
   - prompt: "Sprint goals: [confirmed goals]. Issues: [from Phase 1]. Assess technical complexity, dependencies, execution order, and agent routing."

6. Task → **company alara product engineer** agent
   - subagent_type: company:company-alara-product-engineer
   - prompt: "Sprint goals: [confirmed goals]. Issues: [from Phase 1]. Assess user impact, design complexity, review checkpoints, and UX concerns."

**Note**: All three run in parallel. Classification and specialist assessment happen together since goals are now confirmed.

**Phase 5: Present Combined Matrix**

Synthesize sprint agent classification + Addy + Alara assessments into unified matrix.
Present to user and ask:

1. Schedule these issues to calendar?
2. Adjust any classifications?
3. Done for now

**Phase 6: Calendar Scheduling (only if user requests)**

If user chooses option 1:
- Task → **life calendar** agent with approved issues
- Create calendar events with Linear issue links
- Use extendedProperties to track syncSource: "sprint-planner"

---

## Other Operations

For non-plan operations, route directly to sprint agent:

- **friday** - Task → company sprint with "Friday focus session setup"
- **review/weekly** - Task → company sprint with "Weekly retrospective"
- **status** - Task → company sprint with "Cycle health check"
- **velocity** - Task → company sprint with "4-cycle velocity trend"
- **new/update/cleanup/assign** - Task → company sprint with cycle management request

## Natural Language Examples

- "Plan my sprint" → Full orchestration workflow (Phases 1-6)
- "Set up Friday dev session" → Direct to sprint agent
- "Weekly review" → Direct to sprint agent
- "How's the sprint going?" → Direct to sprint agent
- "Create a new 2-week cycle" → Direct to sprint agent

$ARGUMENTS
