[Maintainability]
- Synced the Angular versions declared by the frontend package manifests
  with the version the application actually installs. The manifests under
  `src/frontend/packages/` still named 22.0.8 while the root manifest and
  lockfile had moved to 22.1.5. Nothing installs from those files — the
  devkit reads them for dependency names only — but the stale numbers were
  enough for dependency scanning to report five advisories against Angular
  packages that ship at a patched version, two of them rated high.
