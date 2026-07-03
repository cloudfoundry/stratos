# Stratos Documentation Website

Docusaurus site that renders the repository's `docs/` tree
(configured via `docs.path: '../docs'` — the site holds no doc
content of its own). Styling is Tailwind CSS v4 with shadcn/ui
components, based on the docusaurus-tailwind-shadcn-template
scaffold.

## Commands

Run from the repository root:

```bash
make build website    # production build into website/build/
make dev website      # dev server with hot reload
make clean website    # remove build output and node_modules
```

Or directly in this directory with bun (`bun install`, `bun run
build`, `bun run start`).

## Authoring docs

Write docs in `docs/` using the GFM subset enforced by
`scripts/lint-docs.mjs` (`bun run lint:docs` from the repo root) so
every page renders identically on GitHub and here. GitHub alert
blockquotes (`> [!NOTE]`) are converted to Docusaurus admonitions by
`src/plugins/remark-github-alerts.js`; mermaid code blocks render as
diagrams.

The sidebar is curated in `sidebars.js` — new pages must be added
there to appear in the site navigation. Landing-page and other
site-only content lives under `src/pages`, never in `docs/`.
