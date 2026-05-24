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

See `docs/superpowers/specs/2026-05-22-stratos-theme-tool-design.md` for the full design spec.

Three signals drive the app:
- `rootValues` — Map of `--token` -> value for the `:root` block
- `darkValues` — same for `.dark-theme`
- `activeSceneId` — currently displayed preview scene

Editor change → debounced parse → signals update → effects propagate to iframe via postMessage.

## Snapshot pack

Place snapshot packs under `public/snapshots/v1/` matching the format documented in the spec (Section 4.5). The bundled stub pack is for development only; production builds include a real pack from `tools/snapshots/`.

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
