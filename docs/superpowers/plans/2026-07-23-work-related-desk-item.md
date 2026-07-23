# Work-Related Desk Item Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `work related stuff` a homepage desk item and move `ai forces preference` into the work directory.

**Architecture:** Keep the existing static HTML structure and visual system. Update the regression boundary first, then change the homepage and work directory without touching the picker or responsive behavior.

**Tech Stack:** HTML5, CSS, vanilla JavaScript, Bash and headless-Chrome regression tests

## Global Constraints

- The homepage contains exactly three links: `who is cedric?`, `where i've been`, and `work related stuff`.
- `work related stuff` links to `./work/`.
- The header contains no work link.
- `ai forces preference` appears only in the work directory and links to `../blog/ai-forces-preference/`.
- The work directory contains exactly seven entries.
- Preserve all existing language-picker, accessibility, responsive, gallery-exclusion, and excerpt-exclusion behavior.
- Preserve unrelated untracked files and user changes.

---

### Task 1: Update the regression boundary

**Files:**
- Modify: `tests/site-redesign.test.sh`

**Interfaces:**
- Consumes: current homepage and work-page HTML
- Produces: updated launch-boundary assertions

- [ ] **Step 1: Change homepage expectations**

Replace the `ai forces preference` homepage link/title checks with:

```bash
assert_contains "$home" 'href="./work/"'
assert_contains "$home" 'work related stuff'
assert_not_contains "$home" 'href="./blog/ai-forces-preference/"'
assert_not_contains "$home" 'class="work-link"'
```

Change the total homepage anchor expectation from four to three while retaining exactly three `.desk-item` links.

- [ ] **Step 2: Change work-directory expectations**

Add:

```bash
assert_contains "$work" 'href="../blog/ai-forces-preference/"'
assert_contains "$work" 'ai forces preference'
```

Change the exact `.work-entry` count from six to seven.

- [ ] **Step 3: Run the test and confirm it fails against the old structure**

Run:

```bash
bash tests/site-redesign.test.sh
```

Expected: nonzero exit because the homepage still contains `ai forces preference`.

- [ ] **Step 4: Commit the failing test**

```bash
git add tests/site-redesign.test.sh
git commit -m "test: move work navigation onto the desk"
```

### Task 2: Move work navigation and the essay

**Files:**
- Modify: `index.html`
- Modify: `work/index.html`
- Test: `tests/site-redesign.test.sh`
- Test: `tests/site-redesign.browser.test.mjs`

**Interfaces:**
- Consumes: existing `.desk-item--two`, `.work-list`, and picker behavior
- Produces: new homepage/work content placement

- [ ] **Step 1: Remove the header work link**

Replace:

```html
<div class="identity">
  <span class="name">Cedric Turner II</span>
  <a class="work-link" href="./work/">work →</a>
</div>
```

with:

```html
<div class="identity">
  <span class="name">Cedric Turner II</span>
</div>
```

Remove the unused `.work-link` CSS rules and mobile override.

- [ ] **Step 2: Replace the second desk item**

Replace:

```html
<a class="desk-item desk-item--two" href="./blog/ai-forces-preference/">ai forces preference</a>
```

with:

```html
<a class="desk-item desk-item--two" href="./work/">work related stuff</a>
```

- [ ] **Step 3: Add the essay to the work directory**

Add this entry after `building supercontext`:

```html
<li>
  <a class="work-entry" href="../blog/ai-forces-preference/">
    <span>ai forces preference</span>
    <small>writing</small>
  </a>
</li>
```

- [ ] **Step 4: Update browser-test selectors and counts**

Remove target-size assertions that query `.work-link`. Keep trigger, option, desk-item, work-entry, and back-link measurements.

Change the work-entry count from six to seven and add `../blog/ai-forces-preference/` to the expected work destinations.

- [ ] **Step 5: Run all tests**

```bash
bash tests/site-redesign.test.sh
node tests/site-redesign.browser.test.mjs
git diff --check
```

Expected:

```text
Homepage content boundary checks passed.
Browser interaction checks passed.
```

- [ ] **Step 6: Commit the implementation**

```bash
git add index.html work/index.html tests/site-redesign.browser.test.mjs
git commit -m "feat: make work a homepage desk item"
```

### Task 3: Verify and publish

**Files:**
- Modify only if defects are found: `index.html`
- Modify only if defects are found: `work/index.html`

**Interfaces:**
- Consumes: completed static site
- Produces: verified live deployment

- [ ] **Step 1: Verify mobile and desktop behavior**

Run:

```bash
bash tests/site-redesign.test.sh
node tests/site-redesign.browser.test.mjs
```

Expected: both suites pass, including 320px, 390px, and desktop viewport checks.

- [ ] **Step 2: Review the final diff**

Run:

```bash
git diff main...HEAD --check
git status --short
```

Expected: no whitespace errors; only pre-existing unrelated untracked files remain.

- [ ] **Step 3: Merge and push after review**

Merge the verified feature branch to `main`, rerun both suites on `main`, push `origin main`, monitor the GitHub Pages workflow, and confirm the public homepage and `/work/` contain the new placement.
