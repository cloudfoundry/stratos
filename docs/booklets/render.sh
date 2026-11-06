#!/usr/bin/env bash
# Assemble and render every booklet under docs/booklets/.
#
# A booklet is a directory holding _quarto.yml (the spine manifest — an
# ordered chapter list drawn from the docs/ pool) plus index.qmd (the
# preface). Quarto requires project inputs inside the project directory,
# so each booklet is assembled by copy into a work dir and rendered
# there; the same docs/ file can appear in several spines.
set -euo pipefail
cd "$(dirname "$0")/../.."

out=dist/booklets
for manifest in docs/booklets/*/_quarto.yml; do
  booklet=$(dirname "$manifest")
  name=$(basename "$booklet")
  work="$out/.work/$name"
  rm -rf "$work"
  mkdir -p "$work"
  cp -R docs/. "$work/"
  rm -rf "$work/booklets"
  cp "$booklet"/* "$work/"
  # GFM-subset shim. docs/ is authored in the GFM intersection subset
  # (renders on GitHub and the website); Quarto handles none of it
  # natively in book output, so rewrite at assembly time:
  #
  # 1. Links: epub/PDF concatenate the chapters into one document and
  #    Quarto leaves markdown links to sibling files as dead file hrefs.
  #    Give each top-level chapter an explicit id on its first H1, then
  #    rewrite in-spine links to internal anchors. Out-of-spine links
  #    are a known ceiling: they become dead anchors — rewrite them to
  #    website URLs here if a spine ever needs one.
  for f in "$work"/*.md; do
    base=$(basename "$f" .md)
    perl -0777 -pi -e 's/^# (.*)$/# $1 {#'"$base"'}/m' "$f"
  done
  perl -pi -e 's/\]\((?:\.\/)?([A-Za-z0-9._-]+)\.md#([^)]+)\)/](#$2)/g; s/\]\((?:\.\/)?([A-Za-z0-9._-]+)\.md\)/](#$1)/g' "$work"/*.md
  # 2. Alerts: "> [!NOTE]" blockquotes render as literal text in both
  #    .md and .qmd chapters — rewrite to Quarto callout divs.
  perl -0777 -pi -e 's{^> \[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*\n((?:> ?.*\n)*)}{"::: {.callout-" . lc($1) . "}\n" . ($2 =~ s/^> ?//mgr) . ":::\n"}gme' "$work"/*.md
  # 3. Mermaid: plain ```mermaid fences stay inert code blocks; only
  #    executable {mermaid} cells in .qmd files render (to images, via
  #    Chrome, for epub/PDF). Rewrite the fence and assemble chapters
  #    as .qmd — the spine in _quarto.yml lists .qmd names.
  perl -pi -e 's/^```[ \t]*mermaid[ \t]*$/```{mermaid}/' "$work"/*.md
  for f in "$work"/*.md; do
    mv "$f" "${f%.md}.qmd"
  done
  quarto render "$work"
  rm -rf "${out:?}/$name"
  mv "$work/_book" "$out/$name"
  echo "Rendered: $out/$name"
done
