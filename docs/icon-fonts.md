# Maintaining Stratos Icon Fonts

Stratos renders icons through two self-hosted ligature fonts. An icon element
contains the icon's *name* as text (`<mat-icon>delete</mat-icon>`); the font's
GSUB ligature table substitutes that letter sequence with the glyph. When a
name has no ligature in the bundled font, the browser renders the literal text
(`rocket_launch`) instead of an icon — the failure is silent, per-icon, and
easy to miss in review.

## The two fonts

| Font | Family | Files | Source of truth |
|---|---|---|---|
| Material Icons | `'Material Icons'` | `src/frontend/packages/core/assets/fonts/iconfont/` | [google/material-design-icons](https://github.com/google/material-design-icons) / Google Fonts |
| Stratos icons | `'stratos-icons'` | `src/frontend/packages/core/assets/fonts/stratos/` | EOS icons (SUSE) + custom additions; generated with grunt-webfont |

`@font-face` declarations live in `src/frontend/packages/core/sass/icons.scss`
(declarations only — the `.material-icons`/`.stratos-icons` class rules live in
`theme/styles/main.scss` inside `@layer base`; keep it that way, see #5539).

## Hosting is a choice with trade-offs

Stratos self-hosts both fonts. That is not the only defensible choice — it is
the one whose costs fit this project, and it comes with a maintenance duty:

| | Hotlink Google Fonts | Self-host (current choice) |
|---|---|---|
| Freshness | Automatic — always the current release | Manual — someone must refresh the files |
| Cascade | The linked stylesheet ships **unlayered** rules that beat `@layer utilities` (one of the four sources of #5539), cross-origin and invisible to CSSOM inspection | All icon CSS is ours, layered where we put it |
| Air-gapped / private-cloud deploys | No icons at all | Works |
| Privacy / CSP | Every page load reaches Google (user IPs); two domains whitelisted forever | No external requests |
| Version control | Google can reshape glyphs under us on any release | Pinned until we choose to update |

The duty that comes with self-hosting: the bundled Material font sat unchanged
from ~2019 to 2026 and fell behind the icon names the code adopted in the
meantime — three rendered as text until the refresh in #5545. If the hosting
choice is ever revisited, weigh the whole column, not one row.

## Rules when adding an icon

1. **Check the name exists in the bundled font first** (see audit below, or
   grep `src/frontend/packages/core/assets/fonts/iconfont/codepoints` for
   Material names). The [Material Icons index](https://fonts.google.com/icons?icon.set=Material+Icons)
   shows the *current* release — the bundled font may be older.
2. Kubernetes entities default to `iconFont: 'stratos-icons'`
   (`kubernetes-entity-generator.ts`) — a Material name there won't resolve,
   and vice versa. Ligature names are exact: `config_map` renders,
   `config_maps` does not.
3. If the name is missing from the bundled Material font, refresh the font
   (below) rather than picking a worse older icon.

## Refreshing the Material Icons font

All files in `src/frontend/packages/core/assets/fonts/iconfont/` come from
Google; refresh them together so the binaries never disagree:

```sh
cd src/frontend/packages/core/assets/fonts/iconfont

# woff2 — the file Google Fonts currently serves (URL is versioned; extract it
# from the CSS response, which varies by requesting browser)
curl -s -A "Mozilla/5.0 ... Chrome/126.0" \
  "https://fonts.googleapis.com/icon?family=Material+Icons" \
  | grep -oE "https://fonts.gstatic.com/[^)]+\.woff2"
curl -o MaterialIcons-Regular.woff2 "<that url>"

# ttf + codepoints — canonical repo
curl -sLo MaterialIcons-Regular.ttf \
  https://raw.githubusercontent.com/google/material-design-icons/master/font/MaterialIcons-Regular.ttf
curl -sLo codepoints \
  https://raw.githubusercontent.com/google/material-design-icons/master/font/MaterialIcons-Regular.codepoints
```

Generate the `woff` from the new `ttf` and regenerate the `ijmap`
(name-per-codepoint metadata) from `codepoints` — both are pure derivations;
`fonttools` does the conversion:

```python
from fontTools.ttLib import TTFont
f = TTFont('MaterialIcons-Regular.ttf'); f.flavor = 'woff'
f.save('MaterialIcons-Regular.woff')
```

Do **not** reintroduce `local('Material Icons')` sources in `icons.scss`: a
stale font installed on a user's machine would shadow the bundled one and
silently reintroduce missing glyphs on that machine only.

## Auditing icon coverage

The check that caught #5545 — diff the icon names referenced in source against
the ligature tables actually present in the bundled fonts:

1. **Collect used names** — grep `src/frontend` for `<mat-icon>…</mat-icon>`
   text, `fontIcon="…"` attributes, and `icon: '…'` properties in TS.
2. **Extract ligatures from each font** — with `fonttools`, walk
   `font['GSUB'].table.LookupList.Lookup[*].SubTable[*].ligatures` and join the
   component glyph names into the ligature string (glyph names are AGL names:
   `underscore` → `_`, `three` → `3` — `fontTools.agl.AGL2UV` maps them).
3. **Diff**: every used name must appear in the Material set or the
   stratos-icons set. A name in neither renders as literal text.

Quick single-name browser check: render the name at `font-size: 24px` with the
font and `font-feature-settings: 'liga'`; a resolved ligature is one ~24px-wide
glyph, a missing one is a wide run of text.

## Maintaining coverage through CI

The audit above is mechanical, needs no network (both fonts are in the repo),
and fails loud where a human review fails silent — which makes it a good CI
lint. The shape:

```yaml
# .github/workflows/... — icon-coverage job
icon-coverage:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: pipx run --spec "fonttools[woff]" python scripts/check-icon-coverage.py
```

`scripts/check-icon-coverage.py` does the three audit steps in one pass:

```python
# 1. used names: scan src/frontend for <mat-icon>NAME</mat-icon>,
#    fontIcon="NAME", and icon: 'NAME' (same regexes as the audit section)
# 2. available names: GSUB ligature strings from both bundled fonts
#    (MaterialIcons-Regular.woff2 + stratos-icons.woff2), AGL-mapping
#    component glyph names via fontTools.agl.AGL2UV
# 3. exit 1 listing any used name present in neither font
sys.exit(f"icons missing from bundled fonts: {missing}" if missing else 0)
```

Operational notes:

- **Run it on every PR** rather than path-filtering: a new icon name arrives
  through `.html`/`.ts` edits anywhere in `src/frontend`, so a narrow path
  filter would miss the common case. The check runs in seconds.
- If it is ever made a **required** check with a path filter anyway, filter at
  the *job* level (`if:` on a `changes` job output), not the workflow level —
  a workflow-level path skip never reports its check and blocks the merge
  queue on "Expected".
- Dynamic icon names (built from data at runtime) are invisible to the static
  scan — keep entity/action icon names as literals in source, which is also
  what makes them greppable.
- The scan intentionally over-collects (any `icon: '…'` string). If it flags a
  non-icon string, tighten the regex or add it to a short allowlist in the
  script — do not weaken the failure into a warning; a warning here is a
  missing glyph in production later.

## Sizing (don't regress #5539)

The icon-font 24px default is defined **once**, in `theme/styles/main.scss`,
inside `@layer base` — so Tailwind text-size utilities can override it. Never
add `.material-icons { font-size: … }` rules in component styles, `icons.scss`,
or (especially) unlayered global CSS; that recreates the dead-utility bug in
#5539, which existed in four places before it was consolidated.
