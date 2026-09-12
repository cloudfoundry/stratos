[BugFixes]
- The `manifest.yml` in the repository root pushed the source tree through
  the retired `stratos-buildpack`, staging a build on the platform and
  asking for 1512M. The documented path pushes the prebuilt package under
  `binary_buildpack` at 256M and builds nothing during staging, so a
  clone-and-push took the stale route at six times the memory. The manifest
  now points at `dist/cf-package`, the directory `make build release cf`
  stages, with the command and buildpack that go with a prebuilt payload.
  The README example and the two manifests on the CF troubleshooting page
  named the same retired buildpack and have been corrected.

[Chores]
- Removed `deploy/ci/automation/cfpushtest.sh`, which targeted the
  discontinued PCF Dev and had been producing a manifest with a duplicated
  `env:` key since the diagnostics setting was added. Nothing invoked it.
