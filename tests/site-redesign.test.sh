#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
home="$repo_root/index.html"
work="$repo_root/work/index.html"

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

assert_not_contains_ci() {
  local file="$1"
  local text="$2"
  if rg -Fiq "$text" "$file"; then
    fail "$file must not contain (case-insensitive): $text"
  fi
}

assert_match_count() {
  local file="$1"
  local pattern="$2"
  local expected="$3"
  local label="$4"
  local matches
  local actual
  local rg_status

  if matches="$(rg -o -- "$pattern" "$file")"; then
    actual="$(printf '%s\n' "$matches" | awk 'END { print NR }')"
  else
    rg_status=$?
    if [[ "$rg_status" -ne 1 ]]; then
      fail "could not count $label in $file"
    fi
    actual=0
  fi

  [[ "$actual" -eq "$expected" ]] || fail "$file must contain exactly $expected $label; found $actual"
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

assert_match_count "$home" '<a[^>]*class="desk-item[^"]*"' 3 'desk-item links'
assert_match_count "$home" '<a\b' 4 'anchors'

assert_not_contains "$home" 'github.com'
assert_not_contains "$home" 'linkedin.com'
assert_not_contains "$home" 'GitHub'
assert_not_contains "$home" 'LinkedIn'
assert_not_contains "$home" 'dbt-perspectives'
assert_not_contains "$home" 'dbt-artifacts'
assert_not_contains "$home" 'data-systems'
assert_not_contains "$home" 'supercontext'
assert_not_contains "$home" 'what-ive-done'
assert_not_contains_ci "$home" 'category'
assert_not_contains_ci "$home" 'date'
assert_not_contains_ci "$home" 'description'
assert_not_contains "$home" '<img'
assert_not_contains "$home" '<section'
assert_not_contains "$home" '<footer'
assert_not_contains "$home" '<time'
assert_not_contains "$home" '<p'
assert_not_contains "$home" 'class="hero'
assert_not_contains "$home" 'class="tagline'
assert_not_contains "$home" 'class="site-desc'
assert_not_contains "$home" 'class="gallery'
assert_not_contains "$home" 'class="section-label'
assert_not_contains "$home" 'class="item-meta'
assert_not_contains "$home" 'class="item-why'

[[ -f "$work" ]] || fail "work/index.html does not exist"
assert_contains "$work" 'href="../"'
assert_contains "$work" 'href="../data-systems/"'
assert_contains "$work" 'href="../supercontext/"'
assert_contains "$work" 'href="../what-ive-done/"'
assert_contains "$work" 'https://cedricturner.github.io/dbt-perspectives/posts/the-script-is-not-your-enemy/'
assert_contains "$work" 'https://cedricturner.github.io/dbt-perspectives/posts/is-dbt-core-enough/'
assert_contains "$work" 'https://cedricturner.github.io/dbt-artifacts/'
assert_contains "$work" 'target="_blank"'
assert_contains "$work" 'rel="noopener noreferrer"'
assert_contains "$work" 'what the data stack becomes'
assert_contains "$work" 'building supercontext'
assert_contains "$work" 'the script is not your enemy'
assert_contains "$work" 'is dbt core enough in the age of AI?'
assert_contains "$work" 'dbt artifacts'
assert_contains "$work" "what i've done"

printf 'Homepage content boundary checks passed.\n'
