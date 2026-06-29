# stb Architecture

Onboarding guide to the Stratos Theme Builder (`tools/stb`). Read this after
the [README](../README.md) quick start. It explains the model, the data pipeline,
and where each piece lives, so you can find your way around and make a change.

## What stb is

A standalone, build-time tool (Vite + TypeScript, no framework — plain DOM +
`@preact/signals-core`) for branding/theming Stratos. An operator loads
captured **snapshots** of Stratos screens, edits brandable values against a
live preview, and exports a bundle that Stratos's branding loader consumes at
boot. stb never runs inside Stratos; it reads snapshots of it.

The distinguishing idea: theming is driven by an **element-semantic model**,
not raw CSS tokens. Brandable elements in Stratos templates are tagged with a
stable identity (`stb-snapshot-id`) and a small set of ARIA-mimicking `stba-*`
attributes (role, roledescription, description). stb harvests those off the
DOM, presents them as a navigable model ("the Sign-in button", "the
confirmation dialog"), and projects edits back down to concrete config + CSS.

## Source of truth and direction

Read this before the pipeline — it explains *why* the data lives where it does.

**The instrumented Stratos DOM is the single source of truth.** Branding and
theming knowledge is meant to live on the real elements as HTML structure, CSS,
and ARIA-like attributes. There is no parallel artifact that can drift: when the
template changes, the semantics are right there on the element to update in
place. Every page change is otherwise a chance for an out-of-band spec to rot
("forgot to update the spec"), so the semantics travel *with* the element.

**The model is generated, not authored.** `scripts/generate-model.ts` harvests
the `stb-snapshot-id` + `stba-*` attributes out of a scene's `index.html` and
emits its `branding-model.json`. That JSON is a **build artifact** — a test
asserts the committed file equals a fresh regenerate (see *Testing*).

**The `.json` files are transitional scaffolding, named as temporary on
purpose.** They are stepping stones that carry knowledge we cannot *yet* express
on the DOM, kept so we don't churn the Stratos templates before the vocabulary
is settled. The destination is DOM-only:

| File | Why it exists today | Where it's headed |
|------|--------------------|-------------------|
| `branding-model.json` | so the running app can `fetch()` the model | already pure-derived; generated, not a source |
| `values.json` | the still-authored bits: friendly `name`, editable `value`, default `visibility` | `name` → DOM `aria-label`; `value` → computed-style capture; then the sidecar shrinks toward nothing |
| `routing.json` | maps snapshot-id → Stratos config key for projection | ideally also moves onto the DOM — **undecided** until more scenes are converted and we see the shape |
| captured snapshots | a shortcut to learn whether/how stb works | the end state themes the **real components**; snapshots are the learning vehicle |

**The `stba`/`stb`/`stbx` prefix scheme.** The instrumentation namespace is split
by prefix so accessibility and theming stay separate concerns even where one
semantic feeds both:

- **`stba-*`** — a strict **1-1 ARIA mirror**: every `stba-X` corresponds to a
  real ARIA attribute (`stba-role`↔`role`, `stba-label`↔`aria-label`,
  `stba-roledescription`↔`aria-roledescription`) and **must adhere to ARIA
  conventions** (valid role vocabulary; identity in the ARIA-correct slot). The
  tool reads **either** namespace — real `aria-*`/`role` *or* `stba-*` — and
  **`stba-*` takes precedence** when both are present (`stba-X ?? aria-X`). So
  `stba-*` is stb's curated override and real ARIA is the fallback the tool
  consumes when no `stba-*` is supplied. Because it mirrors ARIA, the same
  instrumentation is also an a11y on-ramp: `stba-*` can later **promote** to
  real `aria-*`/`role` (the phased outbound direction, below).
- **`stb-*`** — pure theming, zero ARIA meaning (`stb-snapshot-id` is just
  type-agnostic identity; future colour/asset/visibility carriers live here).
- **`stbx-*`** — a genuinely shared *semantic* concept that projects to **both**
  layers (e.g. a `severity` that drives both alert urgency and a danger colour).
  One upstream truth, two independent projections — not mixing. *(Not in use
  yet; reserved by the scheme.)*

**ARIA projection — two directions.** The `stba-*` correspondence runs both
ways, and the two directions have different status:

- **Inbound (read) — in use now.** Model-generation ingests an element's
  semantic identity from **either** real `aria-*`/`role` **or** `stba-*`, with
  `stba-*` winning. This is a present tool requirement, not deferred. A useful
  consequence: elements that already carry real ARIA (the login message
  `role="note"`, the error `role="alert"`) need **no duplicate `stba-role`** —
  the tool reads the real one — so the old `role`-dedup worry dissolves into the
  precedence rule. You author `stba-*` only to override or to fill a gap.
- **Outbound (emit) — phased.** Mechanically *writing* `stba-*` back out as real
  `aria-*`/`role` into the **shipped Stratos DOM** (the actual accessibility
  improvement) is deliberately later, not the next build. Designing it before we
  have real instrumentation data — especially how many `stbx-*` shared-semantic
  cases exist — would be speculative, and this is the direction where a wrong
  annotation *would* be an a11y regression, so it wants real care.

While `stba-*` stays inbound-only it is a **private namespace, not live ARIA**:
a wrong annotation produces a theming mistake, never an accessibility regression
(a screen reader never sees it). So instrument freely now; the a11y-correctness
discipline attaches when the outbound emission is built. Because `stba-*` is held
to ARIA conventions today, that later emission stays mechanical.

The **`aria-roledescription` unlock** is why the container "kind" rides on
`roledescription`: ARIA's `role` vocabulary is a fixed closed set (no
`role="stepper"`), so a stepper stays a valid `role="group"` *named* "stepper"
via `aria-roledescription`.

**Descriptions — the composite shape (resolved authoring direction).** The
opaque, theming-worded `stba-description` ("background color for the login page")
is being replaced by two explicit pieces the tool composes:
- **Identity (the subject)** lives in `stba-*` as *ARIA-correct* terms. Its slot
  **varies per element** — `roledescription` for a custom-named container
  ("login" group, "stepper"), the accessible **name** for a field (a `textbox`
  is identified by its name "Username", *not* `roledescription`, which would
  wrongly override the spoken role), text for a heading.
- **Theming aspect** lives in **`stb-facet`** (e.g. `stb-facet="background
  color"`) — the brandable property, which has no ARIA equivalent, so it is pure
  `stb-`. ("facet" is a coined term; design-token taxonomy has no single word for
  this bundle, and `stb-property` would collide with its loaded meaning.)
- The tool **composes** the description, default `"{facet} for {subject}"` →
  "background color for login". An `stb-composite-order` attribute overrides the
  order, added only when a real case breaks "x for y".

**This is experimental.** Repurposing ARIA-shaped attributes as a theming
vocabulary is a research direction — no existing standard covers the
element-semantic layer stb occupies. The stance is ARIA-first (reach for real
ARIA where it fits) with a private `stb-*` supplement where ARIA doesn't fit
(colour and brand-visibility have no ARIA equivalent). Treat the vocabulary as
provisional and validated by use, not a closed design.

## The pipeline (end to end)

```
  Stratos templates                 capture                 tools/stb
  ─────────────────                 ───────                 ─────────
  <button stb-snapshot-id=          harvest +               public/snapshots/v1/<scene>/
    "auth.login.sign-in"      ──►   snapshot      ──►          index.html        (instrumented DOM)
    stba-role="button"              pack                       values.json       (authored: name/value)
    stba-roledescription=                                      branding-model.json (GENERATED)
    "dialog">                                                  routing.json      (id → config)
                                                               styles.css, assets
                                                                      │
                                                                      ▼
                                                          ┌─ navigator (columns/tree)
                                          load into        ├─ preview (iframe + shim)
                                          signals      ──► ├─ editor (per-lever popover)
                                                           └─ token sidebar
                                                                      │  edit
                                                                      ▼
                                                          projector  ──►  company-config.json
                                                          css emitter ──► theme.css
                                                                      ▼
                                                              export bundle (.zip)
                                                                      │
                                                                      ▼
                                            Stratos assets/branding/  ── boot ──► branded UI
```

1. **Instrument** — Stratos templates carry `stb-snapshot-id` (a stable
   dot-path identity, e.g. `auth.login.sign-in`) and the ARIA-mimicking
   `stba-role` / `stba-roledescription` / `stba-description` attributes
   (see *Source of truth and direction* above). These are plain static
   attributes; they have no runtime effect in Stratos today.
2. **Harvest / capture** — tooling reads the instrumented DOM into a
   **snapshot pack** under `public/snapshots/v1/<scene>/`.
   `scripts/harvest-login.ts` extracts the ids/attributes and lint-checks them
   against routing; `scripts/generate-model.ts` combines that harvest with the
   `values.json` sidecar to (re)build `branding-model.json`.
3. **Load** — at startup the app loads the snapshot pack into signals (see
   *State* below).
4. **Navigate / edit** — the operator drills the navigator, the preview
   iframe shows the live scene, and editing a *lever* updates the model.
5. **Project / export** — the projector maps model edits through the routing
   map to a `company-config.json`, the CSS emitter produces `theme.css`, and
   the export bundles them with assets.

## Core concepts

- **snapshot-id** (`stb-snapshot-id`) — the primary, stable identity of a
  brandable element. A dot-path: `<area>.<container>.<element>`
  (`auth.login.sign-in`). It is the join key across the whole pipeline:
  template ↔ snapshot HTML ↔ model node ↔ routing entry.
- **container kind** (`stba-roledescription`) — marks *what kind of container*
  a node is (page/dialog/stepper/panel). It rides on `roledescription` precisely
  because ARIA's `role` set is closed (no `role="stepper"`); it projects to
  `aria-roledescription`. Rendered as a glyph at every navigator level, so a
  dialog reads as a dialog wherever it appears.
- **role / description** (`stba-role` / `stba-description`) — the element's ARIA
  role and a human description, harvested off the DOM and carried on the model
  node. They project to real `role` / `aria-description` (see above).
- **scene** — one captured screen (`login`, `app-list`, `shared`). Listed in
  `manifest.json`. In the navigator, scenes are the top-level **area**.
- **lever** — a single editable property on an element. A node's `value` is
  one of: `color` (OKLCH), `content` (text), or `asset` (image ref). Plus an
  optional `visibility` toggle.
- **tokens** — the lower CSS layer: `rootValues` (`:root`) and `darkValues`
  (`.dark-theme`) maps of `--custom-property` → value. The element model sits
  *above* tokens; some element edits resolve to token changes.
- **routing map** (`routing.json`) — maps a snapshot-id to the Stratos config
  key it drives (`config`) and optional `visibilityConfig`, plus a
  `containers` map (id-prefix → config namespace). The projector reads this to
  turn model edits into real config.
- **projection** — turning the edited model + routing into the deliverable
  (`company-config.json` + `theme.css`).

## Snapshot pack format

`public/snapshots/v1/` holds the dev/stub pack. Per scene
(`public/snapshots/v1/<scene>/`):

| File | Purpose |
|------|---------|
| `index.html` | the rendered, instrumented DOM shown in the preview iframe — **the source of truth** for identity/role/roledescription/description |
| `values.json` | the still-authored sidecar: `{ "<snapshotId>": { name, value, visibility? } }` (see *Source of truth and direction*) |
| `branding-model.json` | **generated** `{ scene, nodes[] }` — `generate-model.ts` merges the harvested DOM with `values.json`. A build artifact, not hand-edited |
| `routing.json` | snapshot-id → Stratos config mapping (+ `containers`) |
| `styles.css` | the scene's CSS, linked by `index.html` |
| assets (`*.svg`, …) | images referenced by the scene |

`manifest.json` (pack root) lists scenes: `{ id, name, archetype, thumbnail }`.
A scene with no `branding-model.json` simply contributes nothing to the
navigator; a missing `routing.json` is tolerated (edits just don't project).
An instrumented element with no `values.json` entry is skipped by the generator
(it's a label, not a lever).

## State (signals)

State is plain signals, mutated by pure helpers, read by `effect()`s that
re-render DOM or postMessage the iframe.

| Signal | Module | What |
|--------|--------|------|
| `activeSceneId`, `previewDark` | `state/scene.ts` | which scene is previewed, light/dark axis |
| `brandingModel` | `state/branding.ts` | the **active scene's** model; drives the editor/tree/preview. Reloaded when `activeSceneId` changes |
| `globalModel` | `state/global-branding.ts` | **all scenes merged** (`mergeScenes`) + scene names; drives the column navigator across scenes |
| `rootValues`, `darkValues` | `state/tokens.ts` | the `:root` / `.dark-theme` token maps |
| asset/preset/persistence | `state/*.ts` | uploaded images, saved presets, autosave/restore |

Flow: editor change → pure setter (`setNodeValue`, `setRootValue`, …) →
signal updates → effect re-renders / posts `STB_*` messages to the iframe shim.

## Module map (`src/`)

- `main.ts` — composition root: builds the layout, mounts every view, wires
  selection between navigator ↔ preview ↔ editor.
- `metadata/` — model **types** (`types.ts`: `ElementNode`, `LeverValue`,
  `BrandingModel`, …) and visibility helpers (`visibility.ts`). An
  `ElementNode` is `{ snapshotId, role, roledescription?, name, description,
  value, visibility? }` — every field except `name`/`value`/`visibility` is
  DOM-sourced.
- `data/` — static reference data: `token-meanings.json`, `token-metadata.json`,
  and bundled `presets/`.
- `navigator/column-model.ts` — **pure** Miller-column model: scene-rooted path
  tree, prefix derivation, LIFO drill stack, collapse-to-rail, kind glyphs,
  snapshot-id → tree-address index. (Heavily unit-tested; DOM-free.)
- `ui/` — the views (DOM rendering only):
  - `element-columns.ts` — the column navigator (renders `column-model`)
  - `element-tree.ts` — the per-scene element tree (alternate view)
  - `token-sidebar.ts` — the raw token list (alternate view)
  - `preview-pane.ts` — the iframe host + postMessage bridge
  - `lever-editor.ts` / `color-picker.ts` / `popover.ts` — the edit popover
  - `editor-pane.ts`, `status-bar.ts`, `light-dark-actions.ts`,
    `preset-menu.ts`, `export-dialog.ts`, `asset-manager.ts`, `highlight.ts`
- `iframe-bridge/` — the message contract (`messages.ts`) and `apply-levers.ts`
  (applies a lever to a DOM node inside the iframe).
- `public/preview-shim.js` — runs **inside** the preview iframe: selects
  elements by snapshot-id, applies levers, reports clicks back to the host.
- `color/` — `oklch.ts` (sRGB↔OKLCH + scale/hue helpers), `format.ts`
  (hex/rgb/oklch parse+format), `contrast.ts` + `roles.ts` (WCAG contrast and
  role derivation — present, not yet wired into the UI).
- `parse/` — `css-parser.ts`, `css-emitter.ts`, `completeness.ts` (missing-token check).
- `projection/projector.ts` — `project(model, routing)` → config result.
- `export/` — `bundle-builder.ts` (assembles `preset.json` + `theme.css` +
  optional `company-config.json` + assets) and `zip.ts`.
- `taxonomy/taxonomy.ts` — term/role taxonomy helpers.
- `scripts/` — `harvest-login.ts` (DOM reader: extracts `stb-snapshot-id` +
  `stba-*` per element, + login routing drift lint), `lint-templates.ts`
  (asserts a scene's live-template ids exist in its snapshot — currently the
  shared scene), `generate-model.ts` (`buildModel(scene, html, values)` →
  rebuilds `branding-model.json`), `seed-worklist.ts`.

## Export bundle

The export action produces a zip:

```
my-theme.zip
  preset.json            name/id/description (the saved preset)
  theme.css              :root + .dark-theme token blocks
  company-config.json    projected element/branding config (when non-empty)
  assets/
    logo.svg, favicon.svg, …
```

The operator drops this into Stratos's `assets/branding/` path; Stratos's
cascade loader picks it up at boot.

## Common tasks

**Run / test:**
```bash
npm run dev        # Vite dev server (http://localhost:5173)
npm test           # unit + integration (Vitest)
npm run typecheck  # tsc --noEmit
```

**Regenerate a scene's model** (after editing its `index.html` or `values.json`):
```bash
npx tsx scripts/generate-model.ts <scene>   # rewrites branding-model.json
```

**Add a brandable element to a scene:**
1. Add `stb-snapshot-id="<area>.<container>.<element>"` to the Stratos template
   (and the `stba-role` / `stba-roledescription` / `stba-description` attributes
   as they apply). Mirror the same attributes into the snapshot `index.html`.
2. Add a `values.json` entry keyed by that snapshot-id with the authored bits
   (`name`, `value`, optional `visibility`).
3. Add a `routing.json` entry mapping the id to its Stratos config key.
4. Regenerate the model (above). Don't hand-edit `branding-model.json` — the
   scene test asserts it equals a fresh regenerate.

**Add a new scene/area:**
1. Add an entry to `manifest.json` (`id`, `name`, `archetype`).
2. Create `public/snapshots/v1/<id>/` with `index.html` + `branding-model.json`
   (+ `routing.json`, `styles.css`, assets as needed). It appears as a new
   top-level area in the navigator automatically.

## Testing

Vitest, split by concern under `tests/`. Logic lives in pure modules
(`navigator/column-model`, `color/*`, `parse/*`, `projection/*`) and is
unit-tested directly; `tests/integration/` exercises the iframe shim + lever
application in a real DOM. Prefer adding logic to a pure module and testing it
there rather than in a view.

One guard worth knowing: `tests/metadata/scenes.test.ts` asserts each committed
`branding-model.json` deep-equals a fresh `buildModel(html, values)` — so if you
edit a snapshot DOM or `values.json` and forget to regenerate, the test fails
with "out of sync".
