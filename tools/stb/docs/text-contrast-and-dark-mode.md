# Text contrast against arbitrary backgrounds

How to pick a text color that stays readable — and doesn't turn muddy — against
whatever background it sits on: flat colors, gradients, images, translucent
tints, light and dark mode. Distilled from collected research notes and
corrected after verification on 2026-07-02; every formula below was checked
numerically.

## The verified core: WCAG 2.x luminance

Already implemented in `src/color/contrast.ts` (`relativeLuminance`,
`contrastRatio`) — use those, don't re-derive. The math, for reference:

1. Linearize each sRGB channel: `c ≤ 0.04045 ? c/12.92 : ((c+0.055)/1.055)^2.4`
   (contrast.ts uses the WCAG-published `0.03928` cutoff; the difference is
   below one 8-bit step — either is fine, don't "fix" it).
2. Relative luminance `L = 0.2126·R + 0.7152·G + 0.0722·B`.
3. Contrast ratio `(L_hi + 0.05) / (L_lo + 0.05)`, range 1–21.

**Black-or-white text decision:** flip on the break-even luminance

```
L_break = √(1.05 × 0.05) − 0.05 = 0.1791
```

- `L > 0.179` → black text, else white.
- Guarantee (proven): the better of black/white always achieves at least
  `√21 ≈ 4.58:1`, so the binary choice **always passes WCAG AA** (4.5:1,
  normal text) on a flat opaque background.
- The threshold check and "compute both ratios, keep the larger" are
  mathematically equivalent — use the threshold, it's one comparison.

## Rules the naive version gets wrong

These are the three failure modes found (with counterexamples) in the original
notes — each one produces exactly the unreadable/muddy text this doc exists to
prevent.

1. **Re-check every derived shade.** A hover/active variant shifted in
   lightness must get its own contrast decision. Counterexample: accent
   `#8a8a8a` takes black text at 6.08:1, but its −10-lightness hover `#717171`
   drops black text to 4.30:1 — an AA failure on the state the user is
   actively pointing at. Contrast is a property of the *(text, surface)* pair,
   never of the brand color alone.
2. **Contrast against the surface actually painted.** Text on a ±40-lightness
   "subtle" tint must be checked against the tint, not the accent it was
   derived from (white text chosen for a dark accent is unreadable on that
   accent's pastel tint).
3. **Composite alpha first.** A translucent surface (`bg-accent/10`, overlay
   scrims) has no luminance of its own — blend it over what's underneath
   (`out = α·fg + (1−α)·bg`, per channel, *before* linearization is wrong;
   composite in linear space or accept the small error consciously), then run
   the math on the result.

## Backgrounds that aren't flat colors

This is stb's actual terrain — the background facet is a color backstop plus a
stack of image/gradient layers (`src/metadata/facets.ts`, `backgroundCss`).

- **Gradient:** one text color must survive the whole surface. Evaluate the
  contrast decision at every stop (stops are where the extremes live for a
  two-stop gradient; sample midpoints too when stops are many or the
  interpolation is long). Choose the color that passes *all* of them; if none
  does, the gradient itself is the problem — surface that to the user rather
  than silently picking the least-bad text.
- **Image:** no closed form. Either sample the region behind the text (canvas
  readback) or — the robust designer's answer — put a scrim between image and
  text (a translucent black/white layer or a gradient fade) and contrast
  against the composited scrim. stb's layer stack expresses a scrim naturally:
  it's just one more gradient layer above the image.
- **`transparent` backstop / no paint:** the effective background is whatever
  the cascade paints underneath — resolve through the stack (element layers →
  parent surfaces → page background) before deciding.

## Avoiding *muddy*, not just *failing*

WCAG 2.x ratios are known to overrate white text on mid-tone saturated
backgrounds (oranges, mid-blues, magentas) — text can pass 4.5:1 and still
look washed out. Two practical mitigations, short of adopting APCA (the WCAG 3
draft model, which fixes this but has no normative standing yet):

- Treat 4.5:1 as a floor, not a target — aim ≥ 7:1 for body text when the
  choice is free.
- Do all lightness *manipulation* in **OKLCH**, never HSL. HSL lightness is not
  perceptually uniform (a ±10 HSL shift is a different visual step per hue,
  which is where muddy hover states come from). stb already standardizes on
  OKLCH — `src/color/oklch.ts` (`toOklch`, `oklchToHex`) and
  `src/color/derive-dark.ts` (role-aware dark derivation: surfaces darken,
  foregrounds keep hue and lift lightness for contrast). Derive shades in
  OKLCH, then *verify* them with WCAG luminance (rule 1 above). The two systems
  answer different questions: OKLCH = "how do I move a color," WCAG = "can I
  read this."

## Platform notes (Stratos specifics)

- **Dark mode is a class, not a media query.** Stratos toggles `.dark-theme`
  (stb emits `html:not(.dark-theme)` / `.dark-theme` scoped rules —
  `src/parse/css-emitter.ts`). CSS `light-dark()` and Tailwind's `dark:`
  variant only help if their mode source is wired to that class; don't mix a
  `prefers-color-scheme`-driven mechanism into class-driven theming.
- **Tailwind v4, not v3.** Runtime-themable tokens are declared in CSS
  (`theme/styles/tailwind.css`), not `tailwind.config.js`. To map a runtime
  variable into utilities use `@theme inline` so `bg-accent` compiles to
  `background-color: var(--user-accent)`; opacity modifiers (`bg-accent/10`)
  work in v4 via `color-mix()`. The v3 config-object pattern in the original
  notes does not carry over (and its `/10` modifier never worked in v3 with an
  opaque var anyway).
- **Dark values are a color axis only** (design rule, 2026-07-01): mode may
  change colors, backgrounds, shadow/border paint — never spacing or
  typography.

## What to build on, in order

1. `contrastRatio` / `relativeLuminance` (`src/color/contrast.ts`) — the
   verified decision core.
2. OKLCH derivation (`src/color/oklch.ts`, `src/color/derive-dark.ts`) — shade
   generation.
3. Per-stop gradient checking + alpha compositing — the missing piece if stb
   ever auto-suggests text colors for themed surfaces; the facet model already
   exposes every stop and layer needed to do it.
