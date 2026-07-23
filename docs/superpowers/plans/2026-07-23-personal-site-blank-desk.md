# Personal Site Blank-Desk Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the categorized portfolio homepage with a raw, expanding personal-writing canvas and move all professional material to a separate `/work/` page.

**Architecture:** Keep the site as dependency-free static HTML. `index.html` owns the personal canvas and accessible language-picker interaction; `work/index.html` owns the professional directory. One shell regression test checks content separation, required semantics, launch exclusions, and link targets.

**Tech Stack:** HTML5, CSS, vanilla JavaScript, Bash regression tests

## Global Constraints

- The homepage launches with only `who is cedric?`, `ai forces preference`, and `where i've been`.
- Every homepage text shape links to a standalone page.
- The homepage contains no excerpts, galleries, categories, dates, descriptions, hero copy, section rules, or footer rules.
- The homepage uses Inter, black text on white, restrained irregular outlines, slight rotations, and black-fill hover/focus states.
- Desktop content expands vertically; it never shrinks existing items to make room.
- Mobile content becomes a non-overlapping vertical sequence with alternating alignment.
- `/work/` contains every professional item removed from the homepage.
- The language picker is colorful; English is selectable and unreleased languages are visible but disabled with `aria-disabled="true"`.
- Existing content URLs remain unchanged.
- Do not modify or add photograph galleries until Cedric explicitly requests them.
- Do not introduce a framework, build tool, CMS, search, categories, archive, or new runtime dependency.
- Preserve unrelated untracked files and user changes.

---

## File map

- `index.html`: personal blank-desk homepage, responsive writing layout, language-picker markup/styles/behavior.
- `work/index.html`: professional writing and tools directory with return navigation.
- `tests/site-redesign.test.sh`: dependency-free regression checks for homepage/work separation, launch scope, accessibility attributes, and links.
- `docs/superpowers/specs/2026-07-23-personal-site-blank-desk-design.md`: approved requirements; read-only during implementation.

### Task 1: Lock the launch content boundary with a failing regression test

**Files:**
- Create: `tests/site-redesign.test.sh`

**Interfaces:**
- Consumes: existing `index.html`; future `work/index.html`
- Produces: executable command `bash tests/site-redesign.test.sh`

- [ ] **Step 1: Create the initial homepage assertions**

Create `tests/site-redesign.test.sh` with:

```bash
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
```

- [ ] **Step 2: Run the test and verify the old homepage fails**

Run:

```bash
bash tests/site-redesign.test.sh
```

Expected: nonzero exit with `FAIL: ... index.html is missing: class="desk-item`.

- [ ] **Step 3: Make the test executable**

Run:

```bash
chmod +x tests/site-redesign.test.sh
```

- [ ] **Step 4: Commit the failing regression test**

Run:

```bash
git add tests/site-redesign.test.sh
git commit -m "test: define personal homepage content boundary"
```

Expected: one commit containing only the new test.

### Task 2: Replace the homepage with the personal blank desk

**Files:**
- Modify: `index.html`
- Test: `tests/site-redesign.test.sh`

**Interfaces:**
- Consumes: the approved three personal URLs and `/work/`
- Produces: `.desk`, `.desk-item`, `.desk-item--one`, `.desk-item--two`, `.desk-item--three`

- [ ] **Step 1: Replace the old categorized markup**

Replace the body content with this semantic structure:

```html
<div class="page">
  <header class="site-header">
    <div class="identity">
      <span class="name">Cedric Turner II</span>
      <a class="work-link" href="./work/">work →</a>
    </div>
    <!-- The language picker is added in Task 4. -->
  </header>

  <main class="desk" aria-label="Personal writing">
    <a class="desk-item desk-item--one" href="./blog/27/">who is cedric?</a>
    <a class="desk-item desk-item--two" href="./blog/ai-forces-preference/">ai forces preference</a>
    <a class="desk-item desk-item--three" href="./where-ive-been/">where i've been</a>
  </main>
</div>
```

Keep the existing `<title>Cedric Turner II</title>` and viewport metadata. Replace the old Google Fonts request with:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Replace the old CSS with the blank-page foundation**

Use these tokens and structural rules:

```css
:root {
  --paper: #ffffff;
  --ink: #171717;
  --muted: #73736e;
  --sans: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* { box-sizing: border-box; }
html { background: var(--paper); color: var(--ink); }
body {
  margin: 0;
  min-height: 100vh;
  background: var(--paper);
  font-family: var(--sans);
  font-size: 15px;
  line-height: 1.5;
}

.page {
  width: min(1040px, calc(100% - 56px));
  margin: 0 auto;
  padding: 54px 0 100px;
}

.site-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 28px;
}

.identity {
  display: flex;
  align-items: baseline;
  gap: 16px;
  font-size: 11px;
}

.name { font-weight: 500; }
.work-link {
  color: var(--muted);
  text-decoration: none;
}
.work-link:hover,
.work-link:focus-visible {
  color: var(--ink);
  outline: 1px solid var(--ink);
  outline-offset: 4px;
}

.desk {
  position: relative;
  min-height: 720px;
  margin-top: 96px;
}
```

- [ ] **Step 3: Add reusable outlined-item behavior**

Add:

```css
.desk-item {
  position: absolute;
  display: flex;
  align-items: center;
  min-height: 92px;
  padding: 20px 24px;
  color: var(--ink);
  background: var(--paper);
  border: 1.5px solid currentColor;
  font-size: clamp(16px, 1.8vw, 19px);
  font-weight: 500;
  line-height: 1.25;
  text-decoration: none;
  transition: color 120ms ease, background-color 120ms ease;
}

.desk-item:hover,
.desk-item:focus-visible {
  color: var(--paper);
  background: var(--ink);
  outline: 2px solid var(--ink);
  outline-offset: 4px;
}

.desk-item--one {
  width: 31%;
  top: 12px;
  left: 3%;
  border-radius: 48% 4px 45% 3px / 10% 45% 8% 42%;
  transform: rotate(-.7deg);
}

.desk-item--two {
  width: 33%;
  top: 70px;
  right: 7%;
  border-radius: 4px 47% 5px 40% / 43% 7% 38% 8%;
  transform: rotate(.6deg);
}

.desk-item--three {
  width: 30%;
  top: 300px;
  left: 34%;
  border-radius: 6% 44% 4% 46% / 39% 8% 41% 7%;
  transform: rotate(.4deg);
}
```

- [ ] **Step 4: Add deterministic mobile layout and motion fallback**

Add:

```css
@media (max-width: 720px) {
  .page {
    width: min(100% - 36px, 1040px);
    padding: 34px 0 70px;
  }

  .identity {
    display: block;
  }

  .work-link {
    display: block;
    width: fit-content;
    margin-top: 7px;
  }

  .desk {
    min-height: 0;
    margin-top: 74px;
  }

  .desk-item {
    position: relative;
    width: 88%;
    min-height: 76px;
    inset: auto;
    margin: 0 0 28px;
    font-size: 16px;
  }

  .desk-item:nth-child(even) {
    margin-left: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .desk-item { transition-duration: .01ms; }
}
```

- [ ] **Step 5: Run the regression test**

Run:

```bash
bash tests/site-redesign.test.sh
```

Expected: `Homepage content boundary checks passed.`

- [ ] **Step 6: Check formatting and document smoke assertions**

Run:

```bash
bash tests/site-redesign.test.sh
git diff --check -- index.html tests/site-redesign.test.sh
```

Expected: the regression script passes and `git diff --check` prints nothing.

- [ ] **Step 7: Commit the homepage**

Run:

```bash
git add index.html
git commit -m "feat: turn homepage into personal writing desk"
```

### Task 3: Create the separated work directory

**Files:**
- Create: `work/index.html`
- Modify: `tests/site-redesign.test.sh`

**Interfaces:**
- Consumes: existing professional URLs
- Produces: `/work/` directory page and `.work-entry` links

- [ ] **Step 1: Extend the regression test before creating the page**

Insert after the `home=...` variable:

```bash
work="$repo_root/work/index.html"
```

Append before the final success message:

```bash
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
```

- [ ] **Step 2: Run the test and verify the missing work page fails**

Run:

```bash
bash tests/site-redesign.test.sh
```

Expected: nonzero exit with `FAIL: work/index.html does not exist`.

- [ ] **Step 3: Create the work-page document**

Create `work/index.html` with this body structure:

```html
<div class="work-page">
  <header class="work-header">
    <a class="back" href="../">← Cedric Turner II</a>
    <h1>work</h1>
  </header>

  <main>
    <nav aria-label="Professional writing and projects">
      <ul class="work-list">
        <li><a class="work-entry" href="../data-systems/"><span>what the data stack becomes</span><small>writing</small></a></li>
        <li><a class="work-entry" href="../supercontext/"><span>building supercontext</span><small>writing</small></a></li>
        <li><a class="work-entry" href="https://cedricturner.github.io/dbt-perspectives/posts/the-script-is-not-your-enemy/" target="_blank" rel="noopener noreferrer"><span>the script is not your enemy ↗</span><small>dbt</small></a></li>
        <li><a class="work-entry" href="https://cedricturner.github.io/dbt-perspectives/posts/is-dbt-core-enough/" target="_blank" rel="noopener noreferrer"><span>is dbt core enough in the age of AI? ↗</span><small>dbt</small></a></li>
        <li><a class="work-entry" href="https://cedricturner.github.io/dbt-artifacts/" target="_blank" rel="noopener noreferrer"><span>dbt artifacts ↗</span><small>tool</small></a></li>
        <li><a class="work-entry" href="../what-ive-done/"><span>what i've done</span><small>proof</small></a></li>
      </ul>
    </nav>
  </main>
</div>
```

Use a complete HTML5 document with the same Inter font request, `--paper`, `--ink`, `--muted`, and `--sans` tokens as the homepage.

- [ ] **Step 4: Add the restrained directory styles**

Use:

```css
.work-page {
  width: min(760px, calc(100% - 48px));
  margin: 0 auto;
  padding: 52px 0 90px;
}
.back {
  color: var(--muted);
  font-size: 11px;
  text-decoration: none;
}
h1 {
  margin: 72px 0 56px;
  font-size: clamp(44px, 9vw, 78px);
  font-weight: 500;
  letter-spacing: -.055em;
  line-height: .95;
}
.work-list { margin: 0; padding: 0; list-style: none; }
.work-list li { margin: 0 0 18px; }
.work-entry {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 24px;
  padding: 18px 21px;
  color: var(--ink);
  border: 1.5px solid currentColor;
  border-radius: 48% 4px 45% 3px / 10% 45% 8% 42%;
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
}
.work-list li:nth-child(even) .work-entry {
  border-radius: 4px 47% 5px 40% / 43% 7% 38% 8%;
  transform: rotate(.25deg);
}
.work-entry small {
  color: var(--muted);
  font-size: 10px;
  font-weight: 400;
}
.work-entry:hover,
.work-entry:focus-visible {
  color: var(--paper);
  background: var(--ink);
  outline: 2px solid var(--ink);
  outline-offset: 4px;
}
.work-entry:hover small,
.work-entry:focus-visible small { color: var(--paper); }
```

Add a mobile rule that makes `.work-entry` a block, gives `small` `display:block; margin-top:6px`, and removes rotation.

- [ ] **Step 5: Run regression and formatting checks**

Run:

```bash
bash tests/site-redesign.test.sh
git diff --check -- work/index.html tests/site-redesign.test.sh
```

Expected: the shell test passes and `git diff --check` prints nothing.

- [ ] **Step 6: Commit the work page**

Run:

```bash
git add work/index.html tests/site-redesign.test.sh
git commit -m "feat: separate professional work from personal homepage"
```

### Task 4: Add the colorful, English-only language picker

**Files:**
- Modify: `index.html`
- Modify: `tests/site-redesign.test.sh`

**Interfaces:**
- Consumes: `.site-header`
- Produces: `#language-current`, `#language-menu`, `.language-option`, `openLanguageMenu()`, `closeLanguageMenu()`

- [ ] **Step 1: Extend static accessibility assertions**

Append to `tests/site-redesign.test.sh`:

```bash
assert_contains "$home" 'id="language-current"'
assert_contains "$home" 'aria-haspopup="listbox"'
assert_contains "$home" 'aria-expanded="false"'
assert_contains "$home" 'id="language-menu"'
assert_contains "$home" 'role="listbox"'
assert_contains "$home" 'role="option"'
assert_contains "$home" 'aria-selected="true"'
assert_contains "$home" 'aria-disabled="true"'
assert_contains "$home" '>English<'
assert_contains "$home" '>日本語<'
assert_contains "$home" '>Español<'
assert_contains "$home" '>Português (Brasil)<'
assert_contains "$home" '>Deutsch<'
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
bash tests/site-redesign.test.sh
```

Expected: nonzero exit with `index.html is missing: id="language-current"`.

- [ ] **Step 3: Add the picker markup inside `.site-header`**

Insert after `.identity`:

```html
<div class="language-picker">
  <button class="language-current" type="button" id="language-current"
    aria-haspopup="listbox" aria-expanded="false" aria-controls="language-menu">
    English
  </button>
  <div class="language-menu" id="language-menu" role="listbox" aria-label="Language" hidden>
    <button class="language-option language-en" type="button" role="option" aria-selected="true">English</button>
    <button class="language-option language-ja" type="button" role="option" aria-selected="false" aria-disabled="true">日本語</button>
    <button class="language-option language-es" type="button" role="option" aria-selected="false" aria-disabled="true">Español</button>
    <button class="language-option language-pt" type="button" role="option" aria-selected="false" aria-disabled="true">Português (Brasil)</button>
    <button class="language-option language-de" type="button" role="option" aria-selected="false" aria-disabled="true">Deutsch</button>
  </div>
</div>
```

- [ ] **Step 4: Add the picker styles**

Port the live `dbt-artifacts` visual behavior:

```css
.language-picker { position: relative; z-index: 10; }
.language-current {
  min-width: 154px;
  padding: 9px 14px;
  color: #1f5b8f;
  background: var(--paper);
  border: 1.5px solid currentColor;
  border-radius: 48% 4px 45% 3px / 10% 45% 8% 42%;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  text-align: left;
}
.language-current::after { float: right; content: "+"; font-weight: 400; }
.language-current[aria-expanded="true"]::after { content: "−"; }
.language-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 218px;
  padding: 8px;
  background: var(--paper);
  border: 1.5px solid var(--ink);
}
.language-menu[hidden] { display: none; }
.language-option {
  display: block;
  width: 100%;
  margin: 0 0 5px;
  padding: 10px 13px;
  color: var(--option-ink);
  background: var(--paper);
  border: 1.5px solid currentColor;
  cursor: pointer;
  font-size: 14px;
  text-align: left;
  transform: rotate(var(--turn));
}
.language-option:last-child { margin-bottom: 0; }
.language-option[aria-selected="true"] {
  color: var(--paper);
  background: var(--option-ink);
}
.language-option[aria-disabled="true"] {
  cursor: not-allowed;
  opacity: .72;
}
.language-option[aria-disabled="true"]:hover,
.language-option[aria-disabled="true"]:focus-visible {
  opacity: 1;
  outline: 2px solid var(--option-ink);
  outline-offset: 2px;
}
.language-en { --option-ink: #1f5b8f; --turn: -.4deg; }
.language-ja { --option-ink: #c43b2f; --turn: .7deg; }
.language-es { --option-ink: #a9432f; --turn: -.8deg; border-bottom-color: #c89118; }
.language-pt { --option-ink: #267044; --turn: .5deg; border-bottom-color: #b48a19; }
.language-de { --option-ink: #2f3032; --turn: -.3deg; border-bottom-color: #b52f35; }
```

- [ ] **Step 5: Add isolated menu behavior before `</body>`**

Add:

```html
<script>
  const languageCurrent = document.getElementById('language-current');
  const languageMenu = document.getElementById('language-menu');
  const languageOptions = [...languageMenu.querySelectorAll('[role="option"]')];

  function openLanguageMenu() {
    languageMenu.hidden = false;
    languageCurrent.setAttribute('aria-expanded', 'true');
    languageOptions[0].focus();
  }

  function closeLanguageMenu({ restoreFocus = false } = {}) {
    languageMenu.hidden = true;
    languageCurrent.setAttribute('aria-expanded', 'false');
    if (restoreFocus) languageCurrent.focus();
  }

  languageCurrent.addEventListener('click', () => {
    if (languageMenu.hidden) openLanguageMenu();
    else closeLanguageMenu();
  });

  languageCurrent.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openLanguageMenu();
    }
    if (event.key === 'Escape') closeLanguageMenu();
  });

  languageMenu.addEventListener('keydown', event => {
    const index = languageOptions.indexOf(document.activeElement);
    if (event.key === 'Escape') {
      event.preventDefault();
      closeLanguageMenu({ restoreFocus: true });
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      languageOptions[(index + 1) % languageOptions.length].focus();
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      languageOptions[(index - 1 + languageOptions.length) % languageOptions.length].focus();
    }
  });

  document.addEventListener('click', event => {
    if (!event.target.closest('.language-picker')) closeLanguageMenu();
  });
</script>
```

Disabled options intentionally remain focusable so their color and unavailable state are discoverable. They have no click handler and cannot change the document language.

- [ ] **Step 6: Run regression and formatting checks**

Run:

```bash
bash tests/site-redesign.test.sh
git diff --check -- index.html tests/site-redesign.test.sh
```

Expected: the regression script passes and `git diff --check` prints nothing.

- [ ] **Step 7: Commit the language picker**

Run:

```bash
git add index.html tests/site-redesign.test.sh
git commit -m "feat: add staged colorful language picker"
```

### Task 5: Verify layout, interaction, and launch exclusions

**Files:**
- Modify if verification finds defects: `index.html`
- Modify if verification finds defects: `work/index.html`
- Test: `tests/site-redesign.test.sh`

**Interfaces:**
- Consumes: completed homepage and work page
- Produces: verified desktop/mobile implementation

- [ ] **Step 1: Run the full automated checks**

Run:

```bash
bash tests/site-redesign.test.sh
git diff --check
```

Expected: the shell test passes and `git diff --check` prints nothing.

- [ ] **Step 2: Start a local static server**

Run:

```bash
python3 -m http.server 4173
```

Expected: `Serving HTTP on ... port 4173`. Keep this process running during the remaining checks.

- [ ] **Step 3: Verify desktop homepage at 1440 × 900**

Open `http://localhost:4173/` and confirm:

1. Only three outlined personal-writing links appear.
2. The three items do not overlap.
3. The blank page has no hero, section labels, rules, excerpts, or photographs.
4. `work →` and the language picker float without a header container.
5. Hover and keyboard focus invert each writing item to black with white text.
6. The browser console contains no HTML parsing or JavaScript errors.

Expected: all six observations hold.

- [ ] **Step 4: Verify mobile homepage at 390 × 844**

At a 390-pixel viewport, confirm:

1. All three items form one vertical sequence.
2. The second item aligns right while the first and third align left.
3. No item overlaps another or causes horizontal scrolling.
4. Every link is at least 44 pixels high.
5. The picker opens without covering the identity and work link.

Expected: all five observations hold.

- [ ] **Step 5: Verify language-picker keyboard behavior**

Using only the keyboard:

1. Tab to `English`.
2. Press Arrow Down and confirm the menu opens on English.
3. Press Arrow Down through every disabled language.
4. Press Escape and confirm focus returns to `English`.
5. Reopen the menu, click outside it, and confirm it closes.

Expected: focus remains visible throughout; disabled choices never change page content.

- [ ] **Step 6: Verify the work directory**

Open `http://localhost:4173/work/` and confirm:

1. All six professional links appear.
2. No personal page is duplicated in the work list.
3. The return link opens the homepage.
4. Internal links resolve without 404s.
5. External links retain their existing targets.

Expected: all five observations hold.

- [ ] **Step 7: Confirm launch exclusions directly**

Run:

```bash
rg -n '<img|gallery|excerpt|section-label|item-meta|item-why' index.html
```

Expected: no output.

- [ ] **Step 8: Commit any verification fixes**

If verification required changes:

```bash
git add index.html work/index.html tests/site-redesign.test.sh
git commit -m "fix: polish blank desk responsive behavior"
```

If no changes were needed, do not create an empty commit.

- [ ] **Step 9: Stop the local server**

Press `Ctrl-C` in the server process.

- [ ] **Step 10: Record final repository state**

Run:

```bash
git status --short
git log -5 --oneline
```

Expected: only pre-existing unrelated untracked files remain; the recent commits correspond to the test boundary, homepage, work page, language picker, and any necessary verification fix.
