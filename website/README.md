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

## Deployment

`.github/workflows/website-deploy.yml` publishes the site to GitHub
Pages on every `develop` push touching `docs/` or `website/`
(requires Pages to be enabled on the repo with source "GitHub
Actions"). It builds with `SITE_URL`/`SITE_BASE_URL` set for
`cloudfoundry.github.io/stratos/`; switch those to
`https://stratos.cloudfoundry.org` and `/` once the custom domain
CNAME exists.

Deploy targets follow the Makefile's verb + modifier grammar — the
component says what is deployed, the destination says where:

```bash
make deploy website pages       # preview on your fork's GitHub Pages
make deploy website cf          # cf push to your current cf target
make build deploy website cf    # build locally, then push
```

`deploy website cf` pushes `website/manifest.yml` as a static app to
whatever `cf target` points at (log in and target first — no
environment is baked into the Makefile). Site-specific destinations
can be added from `site.mk`; see `site.mk.example`.

### Fork previews (`deploy website pages`)

`make deploy website pages` force-pushes `HEAD` to the
`pages-preview` branch of your fork (`PAGES_REMOTE`, default
`origin`; override in `site.mk` if your fork is a differently named
remote). The deploy workflow triggers on that branch, builds with
your fork's Pages URL, and publishes to
`https://<you>.github.io/stratos/`. The workflow guards this path to
forks only — the upstream site publishes exclusively from `develop`.

One-time fork setup:

1. Enable Pages with the "GitHub Actions" source:
   `gh api -X POST repos/<you>/stratos/pages -f build_type=workflow`
2. The first deploy auto-creates a `github-pages` deployment
   environment restricted to the default branch. Allow the preview
   branch:
   `gh api -X POST repos/<you>/stratos/environments/github-pages/deployment-branch-policies -f name=pages-preview`

The branch is a disposable deploy trigger — it never holds unique
work and is always force-pushed.
