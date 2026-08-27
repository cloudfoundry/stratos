[BugFixes]
- Pull requests targeting a `release/*` branch now run the full test suite.
  The workflow triggers listed `main`, `develop` and `angular**` only, so a
  release line got no checks at all — pushes to it are gated too.
