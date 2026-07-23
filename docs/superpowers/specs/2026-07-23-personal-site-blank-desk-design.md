# Personal site blank-desk redesign

## Purpose

The personal site should feel like entering Cedric's mind, not browsing a portfolio or a directory of professional expertise.

The homepage becomes a blank, expanding canvas of personal writing. Work-related writing and proof move to a separate page. The design stays visually raw without sacrificing legibility or discoverability.

## Design principles

1. **Personal first.** The homepage represents Cedric's life, attention, travel, identity, and changing opinions. Work remains available but does not organize the site.
2. **A blank page, not a publication template.** No categories, feed chrome, hero statement, introduction, explanatory labels, dates, section rules, or footer rules.
3. **Finished writing earns a shape.** Each outlined text item represents a standalone page. The homepage does not use filler titles or speculative future writing.
4. **Raw through arrangement, not decoration.** Personality comes from irregular outlines, slight rotations, and open space. There are no doodles, paper textures, drop shadows, handwriting fonts, or illustrated desk objects.
5. **Readable as it grows.** New items extend the page vertically. Existing items do not shrink to make room.

## Homepage

### Header

The upper-left contains:

- `Cedric Turner II`
- a small `work →` link to the work page

The upper-right contains the colorful language picker.

The header floats on the blank page. It has no border, background, container, introduction, or tagline.

### Writing canvas

The main area is a loose spatial arrangement of outlined links.

At launch, the canvas contains only existing, relevant standalone personal pages:

- `who is cedric?`
- `ai forces preference`
- `where i've been`

Additional standalone personal pieces can be added without changing the page model.

Writing items use:

- Inter
- black text on white
- a thin black outline
- an irregular border radius based on the language-picker treatment in `dbt-artifacts`
- a slight rotation
- a black fill with white text on hover and keyboard focus

There is no fixed item limit. Desktop items occupy a loose two-dimensional canvas. Each newly added row increases the document height. Item widths vary according to title length, while text remains comfortably readable.

Mobile replaces absolute spatial positioning with a single vertical sequence. Items alternate left and right alignment and retain restrained rotation and irregular outlines.

### Excerpts

The homepage does not launch with text excerpts.

If excerpts are introduced later, they require separate approval and must be unusually strong. They should primarily introduce visual material rather than serve as substitutes for standalone writing.

### Photograph galleries

The homepage does not launch with photograph galleries. They remain a documented future capability and must not be added until Cedric explicitly requests them.

When enabled:

- a gallery appears as a small cluster of two or three overlapping photographs
- gallery clusters sit among writing items on the same blank canvas
- galleries link directly to a gallery view or a specific photographic collection
- gallery clusters remain visibly smaller than writing items
- photographs provide the visual interruption; they do not receive long captions or supporting copy
- galleries extend the page vertically under the same scaling rules as writing

The intended visual relationship is that writing dominates and photographs appear as occasional discoveries.

## Language picker

The language picker reproduces the interaction language of the live `dbt-artifacts` picker:

- irregular outlined current-language control
- menu options with small rotations
- distinct colors per language
- the selected option uses its color as a fill
- clear hover, focus, expanded, and selected states

The first release includes the complete accessible picker interaction but only English content. The menu shows the planned colorful language options in a disabled state. Only English is selectable. Disabled options use `aria-disabled="true"` and do not change the page. They become selectable only when their translated content exists.

Translation work is outside this redesign's initial scope.

## Work page

Create `/work/` as the separated home for professional material.

It contains the material removed from the personal homepage:

- `what the data stack becomes`
- `building supercontext`
- external dbt perspectives
- `dbt artifacts`
- `what i've done`

The work page uses a straightforward text directory. It remains visually related to the homepage through Inter, black and white, and restrained irregular outlines, but it does not imitate the loose personal canvas.

The work page includes a clear route back to the personal homepage.

## Existing pages and routing

Existing standalone pages retain their current URLs:

- `/blog/27/`
- `/blog/ai-forces-preference/`
- `/where-ive-been/`
- `/data-systems/`
- `/supercontext/`
- `/what-ive-done/`

The redesign changes homepage discovery and adds `/work/`; it does not rename or relocate existing content.

All existing page-level return links that point to `/me/` continue to work.

## Interaction and accessibility

- Every outlined item is a semantic link with a descriptive accessible name.
- Hover and keyboard-focus states are visually equivalent.
- Focus remains visible without depending on rotation or color alone.
- The language control follows button/listbox keyboard behavior and maintains `aria-expanded` and selected state.
- Mobile tap targets remain at least 44 pixels high.
- Motion is limited to short color transitions and respects `prefers-reduced-motion`.
- Layout remains usable when fonts fail to load.

## Responsive behavior

### Desktop

- Wide blank canvas
- loose, non-overlapping spatial placement
- variable item widths based on title length
- generous negative space
- document height grows with content

### Mobile

- single vertical sequence
- alternating horizontal alignment
- no overlaps
- smaller but still readable rotation
- language control remains available without covering the identity or work link

## Implementation shape

The site remains static HTML, CSS, and small vanilla JavaScript.

- `index.html` becomes the personal blank-desk homepage.
- `work/index.html` becomes the work directory.
- Homepage item placement is represented with reusable classes or CSS custom properties for width, position, radius, and rotation.
- Mobile layout overrides all absolute placement so content order remains deterministic.
- Language-picker behavior is isolated in a small script.
- No build system, framework, content database, or automatic layout engine is introduced.

## Verification

Before release:

1. Confirm the homepage contains only approved existing personal pieces.
2. Confirm all work material remains discoverable from `/work/`.
3. Confirm no galleries or excerpts appear on the initial homepage.
4. Check for overlaps at common desktop widths.
5. Check the stacked layout at narrow mobile widths.
6. Test every internal and external link.
7. Test language-picker mouse and keyboard behavior.
8. Test visible focus and reduced-motion behavior.
9. Compare the rendered homepage against the approved text-first blank-canvas mockup.

## Out of scope

- Translating site content
- Adding photograph galleries to the initial homepage
- Adding excerpt cards to the initial homepage
- Rewriting the contents of existing standalone essays
- Renaming existing URLs
- Adding a CMS, framework, build pipeline, search, categories, or archive
