# Work-related desk item design

## Purpose

Make the homepage desk the complete navigation surface. Work should appear as one of the things in Cedric's mind rather than as a small utility link in the header.

## Homepage changes

- Remove the `work →` link from the header.
- Keep `Cedric Turner II` and the language picker in the header.
- Keep `who is cedric?` as a personal desk item.
- Keep `where i've been` as a personal desk item.
- Replace the homepage `ai forces preference` item with `work related stuff`.
- Link `work related stuff` to `./work/`.
- Keep `work related stuff` as the final homepage link in DOM order, so it is last in mobile stacking, keyboard traversal, and screen-reader reading order.
- Preserve the existing three-item spatial layout, irregular outlines, hover/focus behavior, and responsive mobile stack.

The homepage continues to contain exactly three outlined desk items and three total links.

## Work-page changes

- Add `ai forces preference` to the `/work/` directory.
- Link it to `../blog/ai-forces-preference/`.
- Keep the existing six work items unchanged.
- The work directory contains exactly seven entries after this change.

## Accessibility and verification

- `work related stuff` uses the same semantic link, focus, hover, mobile alignment, and 44-pixel tap-target behavior as the other desk items.
- The header contains no work navigation after the change.
- The staged language picker behavior remains unchanged.
- Regression tests enforce the new homepage URLs, exactly three homepage links, exactly seven work entries, and the new location of `ai forces preference`.

## Out of scope

- Rewriting the `ai forces preference` essay
- Changing the work-page visual design
- Adding homepage excerpts or photograph galleries
- Changing the language picker
