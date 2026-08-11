[Maintainability]
- `make release cf` now refuses to package a fallback backend artifact that
  does not carry the version being released. The cf fallback takes whatever
  cross-compiled binary the last backend build left in dist/bin, which can
  predate the release being cut — that once shipped a v5.1.0 backend inside
  a package labelled 5.2.0-dev.1. The version is linked into the binary via
  ldflags, so the script now asks the artifact itself before packaging it.
