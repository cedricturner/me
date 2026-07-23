#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
home="$repo_root/index.html"

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

assert_contains() {
  local file="$1"
  local text="$2"
  rg -Fq "$text" "$file" || fail "$file is missing: $text"
}

assert_not_contains() {
  local file="$1"
  local text="$2"
  if rg -Fq "$text" "$file"; then
    fail "$file must not contain: $text"
  fi
}

assert_contains "$home" 'class="desk-item'
assert_contains "$home" '<!DOCTYPE html>'
assert_contains "$home" '</html>'
assert_contains "$home" 'href="./blog/27/"'
assert_contains "$home" 'href="./blog/ai-forces-preference/"'
assert_contains "$home" 'href="./where-ive-been/"'
assert_contains "$home" 'href="./work/"'
assert_contains "$home" 'who is cedric?'
assert_contains "$home" 'ai forces preference'
assert_contains "$home" "where i've been"

assert_not_contains "$home" 'href="./data-systems/"'
assert_not_contains "$home" 'href="./supercontext/"'
assert_not_contains "$home" 'href="./what-ive-done/"'
assert_not_contains "$home" 'cedricturner.github.io/dbt-perspectives'
assert_not_contains "$home" 'cedricturner.github.io/dbt-artifacts'
assert_not_contains "$home" '<img'
assert_not_contains "$home" 'class="gallery'
assert_not_contains "$home" 'section-label'
assert_not_contains "$home" 'item-meta'
assert_not_contains "$home" 'item-why'

printf 'Homepage content boundary checks passed.\n'
