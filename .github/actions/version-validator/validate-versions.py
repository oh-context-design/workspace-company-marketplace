#!/usr/bin/env python3
from __future__ import annotations

"""
Plugin Version Validator

Fails the build when a plugin ships without a proper version bump or with a
plugin.json/marketplace.json version mismatch.

Two independent checks:

  1. sync   - every plugins/<name>/.claude-plugin/plugin.json `version` must
              equal that plugin's `version` entry in the repo-root
              .claude-plugin/marketplace.json. Always runs.

  2. bump   - if a PR changes any file under plugins/<name>/ but the plugin's
              version in plugin.json is unchanged versus the base ref, fail.
              Runs only when --base-ref is supplied (i.e. in a PR context).

Usage:
    python3 validate-versions.py                       # sync check only
    python3 validate-versions.py --base-ref origin/main  # sync + bump check
    python3 validate-versions.py --json                # machine-readable output

Exit codes:
    0 - all checks passed
    1 - one or more validation failures
    2 - configuration error (marketplace.json missing/unreadable, git failure)
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path


def load_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def marketplace_versions(root: Path) -> dict[str, str]:
    """Map plugin name -> version from the root marketplace manifest."""
    manifest = load_json(root / ".claude-plugin" / "marketplace.json")
    versions: dict[str, str] = {}
    for entry in manifest.get("plugins", []):
        name = entry.get("name")
        if name is not None:
            versions[name] = entry.get("version")
    return versions


def plugin_versions(root: Path) -> dict[str, str]:
    """Map plugin name -> version from each plugins/<name>/.claude-plugin/plugin.json."""
    versions: dict[str, str] = {}
    for plugin_json in sorted((root / "plugins").glob("*/.claude-plugin/plugin.json")):
        name = plugin_json.parent.parent.name
        data = load_json(plugin_json)
        versions[name] = data.get("version")
    return versions


def check_sync(root: Path) -> list[str]:
    """plugin.json version must match marketplace.json version for each plugin."""
    market = marketplace_versions(root)
    plugins = plugin_versions(root)
    errors: list[str] = []

    for name, pversion in plugins.items():
        if name not in market:
            errors.append(
                f"{name}: present in plugins/ but missing from marketplace.json plugins[]"
            )
            continue
        mversion = market[name]
        if pversion != mversion:
            errors.append(
                f"{name}: plugin.json version {pversion!r} != marketplace.json version {mversion!r}"
            )

    for name in market:
        if name not in plugins:
            errors.append(
                f"{name}: listed in marketplace.json but plugins/{name}/.claude-plugin/plugin.json is missing"
            )

    return errors


def git(root: Path, *args: str) -> str:
    result = subprocess.run(
        ["git", "-C", str(root), *args],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"git {' '.join(args)} failed: {result.stderr.strip() or result.stdout.strip()}"
        )
    return result.stdout


def changed_plugins(root: Path, base_ref: str) -> set[str]:
    """Plugins with any source change between base_ref and HEAD."""
    out = git(root, "diff", "--name-only", f"{base_ref}...HEAD")
    names: set[str] = set()
    for line in out.splitlines():
        parts = line.split("/")
        if len(parts) >= 2 and parts[0] == "plugins":
            names.add(parts[1])
    return names


def base_plugin_version(root: Path, base_ref: str, name: str) -> str | None:
    """plugin.json version at base_ref, or None if the file did not exist there."""
    spec = f"{base_ref}:plugins/{name}/.claude-plugin/plugin.json"
    try:
        raw = git(root, "show", spec)
    except RuntimeError:
        return None  # new plugin: did not exist on base
    return json.loads(raw).get("version")


def check_bump(root: Path, base_ref: str) -> list[str]:
    """Source changed under plugins/<name>/ requires a plugin.json version bump."""
    plugins = plugin_versions(root)
    errors: list[str] = []

    for name in sorted(changed_plugins(root, base_ref)):
        current = plugins.get(name)
        if current is None:
            continue  # plugin dir removed entirely; nothing to bump
        base = base_plugin_version(root, base_ref, name)
        if base is None:
            continue  # newly added plugin
        if current == base:
            errors.append(
                f"{name}: source changed under plugins/{name}/ but plugin.json version "
                f"is still {current!r} (must be bumped versus {base_ref})"
            )

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate plugin versions for CI.")
    parser.add_argument(
        "--repo-root",
        default=".",
        help="Repository root containing .claude-plugin/marketplace.json (default: cwd).",
    )
    parser.add_argument(
        "--base-ref",
        default="",
        help="Base git ref to diff against. When set, the source-change bump check runs.",
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON output.")
    args = parser.parse_args()

    root = Path(args.repo_root).resolve()

    try:
        sync_errors = check_sync(root)
        bump_errors = check_bump(root, args.base_ref) if args.base_ref else []
    except (FileNotFoundError, RuntimeError, json.JSONDecodeError) as exc:
        if args.json:
            print(json.dumps({"ok": False, "config_error": str(exc)}))
        else:
            print(f"::error::version-validator config error: {exc}")
        return 2

    errors = sync_errors + bump_errors
    ok = not errors

    if args.json:
        print(json.dumps({
            "ok": ok,
            "sync_errors": sync_errors,
            "bump_errors": bump_errors,
        }, indent=2))
    else:
        for err in sync_errors:
            print(f"::error::[version sync] {err}")
        for err in bump_errors:
            print(f"::error::[version bump] {err}")
        if ok:
            scope = "sync + bump" if args.base_ref else "sync"
            print(f"Version validator passed ({scope} checks).")
        else:
            print(f"\nVersion validator FAILED with {len(errors)} error(s).")

    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
