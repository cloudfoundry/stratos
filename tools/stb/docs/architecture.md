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
stable identity (`stb-snapshot-id`) and an optional container kind
(`stb-kind`). stb harvests those, presents them as a navigable model
("the Sign-in button", "the confirmation dialog"), and projects edits back
down to concrete config + CSS.

## The pipeline (end to end)

```
  Stratos templates                 capture                 tools/stb
  ─────────────────                 ───────                 ─────────
  <button stb-snapshot-id=          harvest +               public/snapshots/v1/<scene>/
    "auth.login.sign-in"      ──►   snapshot      ──►          index.html        (rendered DOM)
    stb-kind="dialog">              pack                       branding-model.json (the model)
                                                               routing.json      (id → config)
                                                               metadata.json, styles.css, assets
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
   dot-path identity, e.g. `auth.login.sign-in`) and, on containers,
   `stb-kind` (`page` | `dialog` | `stepper` | `panel`). These are plain
   static attributes; they have no runtime effect in Stratos.
2. **Harvest / capture** — tooling reads the instrumented DOM into a
   **snapshot pack** under `public/snapshots/v1/<scene>/`. `scripts/harvest-login.ts`
   is the reader that extracts ids/kinds and lint-checks them against routing.
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
- **container kind** (`stb-kind`) — marks *what kind of container* a node is
  (page/dialog/stepper/panel). Rendered as a glyph at every navigator level,
  so a dialog reads as a dialog wherever it appears.
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
| `index.html` | the rendered, instrumented DOM shown in the preview iframe |
| `branding-model.json` | `{ scene, nodes[] }` — the element-semantic model (each node: snapshotId, role, name, description, `value`, optional `visibility`, optional `containerKind`) |
| `routing.json` | snapshot-id → Stratos config mapping (+ `containers`) |
| `metadata.json` | element locators + curated descriptions |
| `styles.css` | the scene's CSS, linked by `index.html` |
| assets (`*.svg`, …) | images referenced by the scene |

`manifest.json` (pack root) lists scenes: `{ id, name, archetype, thumbnail }`.
A scene with no `branding-model.json` simply contributes nothing to the
navigator; a missing `routing.json` is tolerated (edits just don't project).

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
  `ContainerKind`, …), description resolution, visibility helpers.
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
- `scripts/` — `harvest-login.ts` (template reader + routing lint),
  `seed-worklist.ts`.

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

**Add a brandable element to a scene:**
1. Add `stb-snapshot-id="<area>.<container>.<element>"` to the Stratos template
   (and `stb-kind` if it's a container).
2. Add a matching node to the scene's `branding-model.json` (with a `value`).
3. Add a `routing.json` entry mapping the id to its Stratos config key.
4. Ensure the snapshot `index.html` carries the same attribute (the scene test
   asserts every model node has a snapshot-id in the HTML).

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
