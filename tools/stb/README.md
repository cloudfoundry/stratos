# stb — Stratos Theme Builder

Build-time CSS theming tool for stratos. Operators load snapshot scenes, edit token values, and export a theme bundle that stratos's cascade loader picks up.

## Quick start

```bash
cd tools/stb
npm install
npm run dev
```

Open http://localhost:5173.

## Commands

- `npm run dev` — start Vite dev server with HMR
- `npm run build` — produce static `dist/` directory
- `npm run preview` — serve the built output
- `npm run test` — run unit + integration tests
- `npm run typecheck` — TypeScript check, no emit
- `npm run lint` — ESLint

## Architecture

See [the architecture doc](docs/architecture.md) for the full picture — the model, the
capture→edit→export pipeline, the module map, and common tasks.

In short: brandable elements carry a stable `stb-snapshot-id` (and optional
`stb-kind`); stb loads captured snapshots into signals, lets you edit elements
against a live preview iframe, and projects edits to a theme bundle. The token
layer is two signals — `rootValues` (`:root`) and `darkValues` (`.dark-theme`) —
with `activeSceneId` selecting the previewed scene. Editor change → pure setter
→ signal update → effects re-render / postMessage the iframe.

## Snapshot pack

Place snapshot packs under `public/snapshots/v1/` (format in
[the architecture doc](docs/architecture.md#snapshot-pack-format)). The bundled stub pack
is for development only; production builds include a real captured pack.

## Export

Export action produces a zip:

```
my-theme.zip
  preset.json
  theme.css
  assets/
    logo.svg
    favicon.svg
```

Operator drops this into stratos's `assets/branding/` path; stratos's cascade loader picks it up at boot.
