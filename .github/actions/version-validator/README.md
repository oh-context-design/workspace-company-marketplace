# Plugin Version Validator

A reusable composite GitHub Action that fails the build on two version mistakes:

1. **Forgotten bump** — a PR changes any file under `plugins/<name>/` but the
   plugin `version` in `plugins/<name>/.claude-plugin/plugin.json` is unchanged
   versus the base branch.
2. **Version drift** — a plugin's `plugin.json` version does not match that
   plugin's `version` entry in the repo-root `.claude-plugin/marketplace.json`.

The sync check (#2) always runs. The bump check (#1) runs only when a base ref
is supplied (i.e. on pull requests).

## Usage

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0          # required: the bump check needs merge-base history

- uses: oh-context-design/workspace-agent-marketplace/.github/actions/version-validator@main
  with:
    base-ref: ${{ github.base_ref }}
```

Inputs:

| Input       | Default | Description                                                              |
|-------------|---------|--------------------------------------------------------------------------|
| `repo-root` | `.`     | Directory holding `.claude-plugin/marketplace.json`.                     |
| `base-ref`  | `''`    | Base branch to diff against. Empty = sync check only (skips bump check). |

## Local run

```bash
# sync check only
swift .github/actions/version-validator/validate-versions.swift

# sync + bump check against origin/main
swift .github/actions/version-validator/validate-versions.swift --base-ref origin/main

# self-tests (synthetic fixtures, pass + both fail paths)
bash .github/actions/version-validator/test-validate-versions.sh
```

Exit codes: `0` pass, `1` validation failure, `2` config error.

## Rollout to the other `workspace-*-marketplace` repos

Every marketplace repo shares the same layout (`.claude-plugin/marketplace.json`
at root, `plugins/<name>/.claude-plugin/plugin.json` per plugin), so the action
drops in unchanged. For each repo:

1. Cross-repo reference (no file copy):

   ```yaml
   - uses: actions/checkout@v4
     with:
       fetch-depth: 0
   - uses: oh-context-design/workspace-agent-marketplace/.github/actions/version-validator@main
     with:
       base-ref: ${{ github.base_ref }}
   ```

   Add this step to the repo's existing `validate.yml` after manifest
   validation. The script travels with the action, so nothing else is copied.

2. Set `fetch-depth: 0` on the `actions/checkout` step (the bump check needs the
   merge-base between the PR head and base).

3. Before enabling, run the sync check locally in that repo and fix any existing
   drift — the gate blocks all PRs until the repo is green:

   ```bash
   swift validate-versions.swift --repo-root /path/to/repo
   ```

Do not modify the other repos as part of AGI-258; this section is the rollout
recipe for follow-up PRs in each repo.
