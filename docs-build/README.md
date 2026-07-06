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
`scripts/lint-docs.mjs`; the spine files currently need no conversion
shim (no GitHub alerts or mermaid blocks). If a future spine pulls in
a chapter using `> [!NOTE]` alerts, add the alert-to-callout rewrite
step to `render.sh` at that point.
