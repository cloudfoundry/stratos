[Features]
- Release notes now accumulate as per-PR fragments in `changelog.d/`, are assembled into the annotated release tag body at `make stamp tag`, published from the tag by `make publish`, and cleared by `make sweep` after each release.
