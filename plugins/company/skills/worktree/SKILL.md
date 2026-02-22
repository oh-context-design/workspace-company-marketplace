---
name: worktree
description: Git worktree decision framework for parallel feature development. Use when planning sprints or engineering work with independent features.
metadata:
  capabilities: git-workflow, branch-management, repository-management
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

# Worktree Decision Framework

Reference for agents that coordinate parallel feature development.

---

## When to Suggest Worktrees

Suggest worktrees when ANY of these conditions apply:

1. **Multi-feature sprints with independent tasks** - Features that don't share code paths or dependencies

2. **Large refactors with decoupled subsystems** - Different subsystems can be modified in isolation

3. **Phased work with parallel opportunities** - Early phases could run simultaneously

4. **Multiple engineers or agent instances** - Concurrent work on different features

---

## Detection Signals

Look for these patterns in plans or requests:

- Plan has "Phase 1", "Phase 2" headers that are independent
- Multiple features listed without explicit dependencies
- Keywords: "parallel", "concurrent", "simultaneously", "independent"
- Multi-file changes touching different directories

---

## Decision Tree

```
┌─────────────────────────────────────────────────────┐
│  Is there more than one independent feature?        │
│                                                     │
│  NO → Standard single-branch workflow               │
│  YES ↓                                              │
├─────────────────────────────────────────────────────┤
│  Do features share code paths or dependencies?      │
│                                                     │
│  YES → Sequential work (resolve conflicts early)    │
│  NO ↓                                               │
├─────────────────────────────────────────────────────┤
│  Is isolation worth the setup overhead?             │
│                                                     │
│  < 2 features → Probably not worth it               │
│  >= 2 features → Suggest worktrees ✓                │
└─────────────────────────────────────────────────────┘
```

---

## Suggestion Pattern

When suggesting worktrees to the user:

```
"This plan has N parallel tasks with no dependencies between them.
Set up worktrees for isolated development?"
```

If user agrees, provide commands:

```bash
# First time setup
mkdir -p .worktrees
grep -q "^.worktrees/$" .gitignore || echo ".worktrees/" >> .gitignore

# Create worktrees for each feature
git worktree add .worktrees/[feature-1] -b feat/[feature-1]
git worktree add .worktrees/[feature-2] -b feat/[feature-2]
```

---

## Git Worktree Commands Reference

| Action | Command |
|--------|---------|
| List worktrees | `git worktree list` |
| Create worktree | `git worktree add .worktrees/[name] -b feat/[name]` |
| Remove worktree | `git worktree remove .worktrees/[name]` |
| Prune stale | `git worktree prune` |

---

## Integration Points

This skill is loaded by:

- **sprint master** agent - For sprint planning with parallel work
- **company addy** agent - For engineering planning
- **workspace handoff** agent - For delegation planning with independent features

---

## What Agents Should NOT Do

Worktree management itself (creation, listing, removal) should be handled directly by the agent using Bash commands. This skill only provides the decision framework for when to suggest worktrees.
