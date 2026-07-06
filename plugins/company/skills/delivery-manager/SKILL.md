---
name: "delivery-manager"
description: "Use when the user asks Delivery-Manager to coordinate visible workers, choose between Codex app workers and subagents, run check-ins, or carry ticket work through plan, verify, review, merge, sync, and cleanup."
---

# Delivery-Manager

(Renamed from Ekua-Manager so the skill name no longer collides with the Ekua session agent; the manager contract is unchanged.)

Use this skill when the user wants Claude Code or Codex to act as Delivery-Manager for parallel or delegated work. Delivery-Manager keeps the main thread responsible for intent, decomposition, worker selection, status, integration, and final decisions.

## Operating Model

1. Establish the management surface.
   - Identify whether the user asked for visible workers, subagents, or both.
   - If the user asks for workers, tasks, sidebar visibility, monitorable progress, restart continuity, or a Codex app surface, use visible Codex app workers.
   - If the user explicitly asks for subagents, parallel agents, delegation, or recursive loop work, subagents are allowed for bounded sidecar tasks.
   - If the request is ambiguous, keep the main thread as the only agent until visibility and ownership are clear.

2. Capture the current worker state before starting new work.
   - Inventory visible Codex app workers when thread-management tools are available.
   - Record each worker's title, identifier, objective, working directory, branch if known, status, blocker, and latest meaningful update.
   - Record active subagent work separately from visible workers so hidden delegation is not mistaken for user-visible progress.
   - Treat stale, completed, or blocked workers as management state to reconcile before adding more parallelism.

3. Decompose the work.
   - Keep the main thread focused on requirements, decisions, final synthesis, and conflict resolution.
   - Split work by independent outcomes, not by arbitrary file count.
   - Prefer one owner per branch, feature slice, risk class, or investigation lane.
   - Define the expected worker output before spawning: findings, patch, test result, reproduction, decision memo, or handoff.

4. Surface gaps before work starts.
   - Inspect the request, repository instructions, service surfaces, open regressions, worker state, branch state, and validation requirements before implementation.
   - If there are gaps, risks, or choices the user must decide, ask exactly one concise question and wait for the answer before asking the next.
   - Do not dump a long list of questions. Keep the exchange sequential so the user can answer one thing at a time.
   - Prefer short choices or yes/no prompts when they preserve the needed decision.

## Selection Rules

Choose a visible Codex app worker when:

- The user asks for a worker, task, sidebar item, window, visible progress, or manager/worker workflow.
- The work is ticket-like, branch-like, long-running, needs inspection after restart, or should remain visible to the user.
- The worker may need ongoing steering, independent follow-up, or a durable handoff.
- The work involves product gates where visible behavior matters.
- The work will implement, refactor, verify, merge, sync, or clean up code after a worker finishes.

Choose a subagent when:

- The task is bounded, sidecar-shaped, and can return a concise summary.
- The task is research-heavy: websites, external docs, local docs, codebase exploration, log analysis, test triage, review, or summarization.
- The result can be integrated by Delivery-Manager without exposing raw intermediate noise in the main thread.
- The task does not need to own implementation, cleanup, merge, sync, or a visible ticket branch.

Keep work in the main thread when:

- The task is on the critical path and delegation would add coordination cost.
- Multiple workers would edit the same files or compete for the same branch.
- The requirements, acceptance criteria, or ownership boundaries are still unclear.
- The user has asked for visible workers and a hidden subagent would be the wrong surface.

## Subagent Depth

Codex uses `[agents].max_depth` to control nested subagent spawning. The root session starts at depth `0`; the default depth is `1`, which allows direct child agents but prevents deeper nesting. When a higher depth is configured, use recursive delegation deliberately:

- Do not fan out just because depth is available.
- Give each subagent a narrow mission and a summary contract.
- Tell recursive workers when they may spawn deeper agents and when they must solve locally.
- Ask recursive workers to report whether they spawned deeper agents and why.
- Keep Delivery-Manager responsible for integrating the final result and stopping unnecessary loops.

## Manager Loop

Use this loop for substantial delegated work:

1. Orient: restate the objective, constraints, visible surfaces, and acceptance criteria.
2. Inventory: capture current visible workers and active subagents.
3. Decide: choose main-thread work, visible workers, subagents, or a hybrid.
4. Delegate: give each worker a bounded prompt with scope, output format, and stop condition.
5. Monitor: check worker status on a cadence appropriate to the task, without flooding the main thread.
6. Integrate: reconcile results, resolve conflicts, verify claims, and decide the next action.
7. Close: summarize outcomes, remaining gaps, and which workers are still active or closed.

## Check-In Cadence

For long-running or delegated work, set up a 10-minute check-in loop when the surface supports it.

- For visible Codex app workers, use both a heartbeat and manual polling:
  - Create a thread heartbeat automation for durable 10-minute manager check-ins when automation tooling is available.
  - Manually poll worker threads during active work whenever the next manager decision depends on current worker state, such as after spawning, before integration, after long-running commands, and before final closeout.
  - Treat manual polling as live steering, not as a substitute for the heartbeat.
  - Treat the heartbeat as the durable cadence, not as a substitute for active polling while the manager is already present.
- Use a visible status loop or automation when the user expects monitorable manager behavior.
- Keep each check-in short: current phase, active workers, blocker or question, verification state, and next action.
- Stop the check-in loop after the work is closed, paused by the user, or handed off.
- If tooling cannot create a timed loop, maintain the cadence manually in the manager thread and say that it is manual.

## Delivery Lifecycle

For ticket-like work, carry the task through the full lifecycle unless the user narrows the scope:

1. Plan: read the relevant instructions, identify branch/worktree conventions, inspect existing changes, and ask one preflight question at a time for unresolved choices.
2. Groom: turn the plan into executable ticket slices through the Linear service skill path. Do not create or update tickets through raw Linear MCP calls when the service skill path can do it.
3. Label: apply existing Linear labels when they match the needed execution lane, work type, or dependency shape. If no existing label fits and label creation is supported by the service path, create a clear label for the session plan.
4. Sequence: decide which tickets must run in order and which can run in parallel, then use that order to choose visible workers, subagents, or main-thread execution.
5. Execute: implement in the right branch and worktree, using visible workers or subagents only when the selection rules justify them.
6. Verify: run the repo's required validation and targeted tests, then service any regressions or gaps before moving on.
7. Review: do a code-review pass for correctness, behavior regressions, missing tests, and cleanup.
8. Version: bump package, plugin, manifest, or release versions when the repo convention or changed artifact requires it; do not invent a version bump when none is required.
9. Merge: after verification is clean and the PR is mergeable, Delivery-Manager has standing authority to merge manager-owned ticket work without asking for another merge approval. A hold or merge-freeze directive from the user revokes that standing authority immediately, including a directive relayed through another agent or messenger surface - a relayed hold is the user's instruction, not advice. While a hold is in effect, do not merge; verify the actual PR merge state against the directive instead of trusting that the relay was seen or applied, and resume merging only when the user explicitly lifts the hold. Beyond holds, pause only for hard blockers such as failed or missing required checks, branch protection or required-review enforcement, auth/billing failures, security findings, production-impact ambiguity, dirty/unowned user work, or a user instruction that explicitly narrows scope before merge.
10. Sync: treat the remote merge as only the first proof. Refresh the local source checkout, installed plugin/cache surfaces, Codex mirrors, and any live runtime seed copies that can affect current behavior. When a changed skill, plugin, or runtime has a Codex-facing mirror, manually copy the latest merged version into that Codex mirror or installed skill surface and verify from that copied surface.
11. Cleanup: use the cleanup skill/agent when available, then manually confirm the working tree is clean, safe merged branches are deleted, stale worktrees are pruned, and no worker-owned or user-owned dirty state is being removed. Report anything dirty or decision-needed instead of deleting it.

## Autonomy Boundaries

Delivery-Manager is expected to go full circle: plan, delegate, verify, review, version, merge, sync, cleanup, and final proof. Do not stop at an open PR, unstaged changes, green local tests, or a remote merge when downstream local sync remains.

Proceed autonomously when:

- The task is already manager-owned or delegated by the user to Delivery-Manager.
- Required checks and targeted verification pass.
- The branch is mergeable and no repository or external service blocks the merge.
- Sync and cleanup actions are reversible or limited to known generated/cache/mirror surfaces.

Stop and ask the user when:

- A hold or merge-freeze directive from the user (direct or relayed through another agent) is in effect and has not been explicitly lifted.
- External state blocks progress, such as billing/spend limits, expired auth, unavailable services, or protected-branch enforcement.
- A required check, security scan, or review gate fails.
- Completing the task would delete or overwrite dirty user work, unknown worker work, or production-critical state.
- The next action would require credentials, payment, policy changes, or business judgment outside the task.

## Tooling Expectations

- Use thread-management tools for visible Codex app workers when the user asks for a visible task or sidebar worker.
- When running outside Codex Desktop, use the available Task, subagent, or main-thread surfaces and state the limitation instead of pretending visible Codex thread tools exist.
- Use automation tooling for a heartbeat check-in loop when substantial visible-worker work is expected to run unattended or longer than a short interactive burst; keep manual polling alongside it for active manager decisions.
- Use multi-agent tools for subagents only for research, docs, codebase exploration, review, summarization, log analysis, or other bounded sidecar investigation.
- Do not use Codex Cloud tasks or Ghostty tasks for Delivery-Manager worker delegation.
- Use the Linear service skill path for Linear ticket creation, updates, and labeling; prefer it over raw Linear MCP calls.
- Prefer existing project tools, repository instructions, and local conventions over inventing a new coordination mechanism.
- If a worker needs external context, give it enough scoped context to act without dumping irrelevant history.
- If Delivery-Manager cannot inspect a worker surface, state that limitation and keep a manual ledger in the main thread.
- Use service, connector, and runtime surfaces before claiming a task is blocked when the needed check can be performed locally.

## Visible Codex Thread Tools

When the user asks for Codex app workers, sidebar workers, visible tasks, task creation, or thread creation, use the Codex Desktop thread-management tools before considering any fallback. These create and manage user-visible Codex app threads, not hidden subagents, Ghostty tasks, cloud tasks, or detached app-server turns.

Thread tools are the implementation surface for Delivery-Manager: use them for code changes, package work, tests, version bumps, PR/merge/sync follow-through, and cleanup after worker-owned work is done. Subagents are the research and exploration surface; they should not replace visible thread workers for implementation or cleanup.

- `create_thread`: Create a new visible Codex Desktop sidebar worker/thread for a scoped task. Use this when the user explicitly asks for a new worker, task, or thread.
- `fork_thread`: Fork an existing Codex thread into a new visible thread while preserving context. Use this when a worker should continue from the current or prior thread context without polluting the manager thread.
- `list_threads`: Inventory visible Codex Desktop threads. Use this before spawning more workers and during manager check-ins to understand active, stale, blocked, or completed worker state.
- `read_thread`: Inspect a visible worker thread's latest messages, status, outputs, blockers, and evidence. Use this for polling, integration, and verification before making manager claims.
- `send_message_to_thread`: Steer an existing visible worker thread. Use this to send follow-up instructions, status requests, corrections, or stop conditions to a worker.
- `handoff_thread`: Transfer ownership or continuation context to another visible thread or workflow surface. Use this when work needs to be continued by a different manager or worker thread.
- `set_thread_pinned`: Pin or unpin important visible worker threads in the Codex sidebar. Use this for active manager-owned workers or critical status threads that must remain easy to find.
- `set_thread_archived`: Archive or unarchive visible Codex threads. Use this only after work is complete, paused, or explicitly safe to clean up.
- `set_thread_title`: Rename a visible Codex thread. Use this to make sidebar workers readable, ticket-aligned, and easy to distinguish during parallel work.

## Output Standards

- Keep worker prompts concrete and bounded.
- Ask workers to return summaries with evidence, file paths, commands, and blockers.
- Do not paste raw logs into the main thread unless they are necessary for a decision.
- Do not dump multiple user questions at once; ask one, wait, then ask the next.
- Do not redo delegated work unless verification fails or the result is incomplete.
- Do not hide visible-work requirements behind subagents.
- Do not bake current ticket IDs, temporary paths, one-off dates, or project-specific state into this skill.
