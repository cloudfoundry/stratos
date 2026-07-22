# Booklets

Offline renderings (epub + PDF) of curated slices of `docs/`, built
with [Quarto](https://quarto.org).

Each subdirectory is one booklet: `_quarto.yml` lists the chapters (an
ordered spine over the `docs/` pool — the same file may appear in
several booklets) and `index.qmd` holds the preface. `render.sh`
assembles each booklet into a work directory and renders it to
`dist/booklets/<name>/`.

Build via the repo make system:

```
make build booklets
```

For a live-preview drafting loop on one booklet, render once, then run
Quarto's preview against its work directory:

```
quarto preview dist/booklets/.work/theming
```

Chapters must stay inside the GFM subset enforced by
`scripts/lint-docs.mjs`. Quarto handles none of the subset's
extensions natively in book output, so `render.sh` rewrites at
assembly time: in-spine links become internal anchors, `> [!NOTE]`
alerts become callouts, and `mermaid` fences become executable
`{mermaid}` cells (chapters are assembled as `.qmd` for this; the
spine lists `.qmd` names, and diagram rendering needs Chrome, which
Quarto finds on dev machines and CI runners alike). Known ceiling:
links to docs/ pages outside the spine become dead anchors — add a
website-URL rewrite if a spine ever needs one.
