#!/usr/bin/env bash
# Self-test for validate-versions.swift: exercises pass + both fail paths against
# synthetic git fixtures. Run: bash .github/actions/version-validator/test-validate-versions.sh
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VALIDATOR="${SCRIPT_DIR}/validate-versions.swift"
PASS=0
FAIL=0

note() { printf '%s\n' "$*"; }
ok()   { PASS=$((PASS+1)); note "  PASS: $1"; }
bad()  { FAIL=$((FAIL+1)); note "  FAIL: $1"; }

# Build a fixture repo with one plugin at the given plugin/marketplace versions.
make_repo() {
  local dir="$1" pver="$2" mver="$3"
  mkdir -p "$dir/.claude-plugin" "$dir/plugins/demo/.claude-plugin"
  cat > "$dir/.claude-plugin/marketplace.json" <<EOF
{ "name": "fixture", "plugins": [ { "name": "demo", "source": "./plugins/demo", "version": "$mver" } ] }
EOF
  cat > "$dir/plugins/demo/.claude-plugin/plugin.json" <<EOF
{ "name": "demo", "version": "$pver" }
EOF
  echo "v1" > "$dir/plugins/demo/code.txt"
  git -C "$dir" init -q
  git -C "$dir" config user.email t@t.t
  git -C "$dir" config user.name t
  git -C "$dir" add -A
  git -C "$dir" commit -qm base
}

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# ---- Case 1: synced versions, no diff -> sync check PASSES ----
R1="$TMP/synced"
make_repo "$R1" "1.0.0" "1.0.0"
swift "$VALIDATOR" --repo-root "$R1" >/dev/null 2>&1
[ $? -eq 0 ] && ok "synced versions -> exit 0" || bad "synced versions should pass"
swift "$VALIDATOR" --repo-root "$R1" --json | grep -q '"ok" : true'
[ $? -eq 0 ] && ok "json output includes ok true" || bad "json output should include ok true"

# ---- Case 2: plugin.json != marketplace.json -> sync check FAILS ----
R2="$TMP/mismatch"
make_repo "$R2" "1.1.0" "1.0.0"
swift "$VALIDATOR" --repo-root "$R2" >/dev/null 2>&1
[ $? -eq 1 ] && ok "version mismatch -> exit 1" || bad "version mismatch should fail"

# ---- Case 3: source changed, version NOT bumped -> bump check FAILS ----
R3="$TMP/nobump"
make_repo "$R3" "1.0.0" "1.0.0"
BASE3=$(git -C "$R3" rev-parse --abbrev-ref HEAD)
git -C "$R3" checkout -q -b feature
echo "v2" > "$R3/plugins/demo/code.txt"        # source change, version untouched
git -C "$R3" commit -qam "change source, no bump"
swift "$VALIDATOR" --repo-root "$R3" --base-ref "$BASE3" >/dev/null 2>&1
[ $? -eq 1 ] && ok "source change without bump -> exit 1" || bad "no-bump should fail"

# ---- Case 4: source changed AND version bumped synced -> PASSES ----
R4="$TMP/bumped"
make_repo "$R4" "1.0.0" "1.0.0"
BASE4=$(git -C "$R4" rev-parse --abbrev-ref HEAD)
git -C "$R4" checkout -q -b feature
echo "v2" > "$R4/plugins/demo/code.txt"
sed -i.bak 's/1.0.0/1.0.1/' "$R4/plugins/demo/.claude-plugin/plugin.json"
sed -i.bak 's/1.0.0/1.0.1/' "$R4/.claude-plugin/marketplace.json"
rm -f "$R4"/plugins/demo/.claude-plugin/*.bak "$R4"/.claude-plugin/*.bak
git -C "$R4" commit -qam "change source, synced bump"
swift "$VALIDATOR" --repo-root "$R4" --base-ref "$BASE4" >/dev/null 2>&1
[ $? -eq 0 ] && ok "synced bump on source change -> exit 0" || bad "synced bump should pass"

# ---- Case 5: docs-only change at repo root -> PASSES ----
R5="$TMP/docsonly"
make_repo "$R5" "1.0.0" "1.0.0"
BASE5=$(git -C "$R5" rev-parse --abbrev-ref HEAD)
git -C "$R5" checkout -q -b feature
echo "# notes" > "$R5/README.md"               # outside plugins/, no bump needed
git -C "$R5" add -A && git -C "$R5" commit -qm "docs only"
swift "$VALIDATOR" --repo-root "$R5" --base-ref "$BASE5" >/dev/null 2>&1
[ $? -eq 0 ] && ok "docs-only change -> exit 0" || bad "docs-only should pass"

# ---- Case 6: missing plugin.json version -> sync check FAILS ----
R6="$TMP/missing-version"
make_repo "$R6" "1.0.0" "1.0.0"
sed -i.bak 's/, "version": "1.0.0"//' "$R6/plugins/demo/.claude-plugin/plugin.json"
rm -f "$R6"/plugins/demo/.claude-plugin/*.bak
swift "$VALIDATOR" --repo-root "$R6" >/dev/null 2>&1
[ $? -eq 1 ] && ok "missing plugin version -> exit 1" || bad "missing plugin version should fail"

# ---- Case 7: missing marketplace manifest -> config error exit 2 ----
R7="$TMP/config-error"
mkdir -p "$R7"
swift "$VALIDATOR" --repo-root "$R7" >/dev/null 2>&1
[ $? -eq 2 ] && ok "missing marketplace manifest -> exit 2" || bad "config error should exit 2"

note ""
note "Results: $PASS passed, $FAIL failed."
[ $FAIL -eq 0 ]
