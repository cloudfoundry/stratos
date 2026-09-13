[Maintainability]
- Removed `e2e/secrets.yaml`, a developer's local E2E credentials file
  committed by accident. Nothing read it: the supported layout is a
  gitignored `secrets.yaml` at the repository root, created from
  `e2e/secrets.yaml.template`. The path is now in `.gitignore` so the
  copy cannot come back.
- Quietened the `make audit secrets` scan. `gitleaks dir` walks the
  filesystem rather than the git index, so every run reported the
  developer's own gitignored credentials and the third-party Helm chart
  cache. Those paths are allow-listed by exact path, leaving the scan
  clean and any finding in a trackable file visible.
