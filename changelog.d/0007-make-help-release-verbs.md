[Maintainability]
- `make help` now lists the three release-flow verbs it skipped:
  `changelog` (dependency-bump audit), `preview` (render the notes as
  the release page will show them) and `sweep` (remove consumed
  fragments) — the notes-preview step was undiscoverable exactly when
  it matters, right before a tag.
