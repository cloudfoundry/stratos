[Security Updates]
- Two CVEs were cleared in the build tooling. The devkit's `js-yaml`
  override moved 4.3.1 to 4.3.2 (CVE-2026-84375, high): the devkit
  resolves through its own `package-lock.json`, so the root workspace's
  earlier move to js-yaml 5 never reached it. `adm-zip` moved 0.6.0 to
  0.6.1 (CVE-2026-76845): the advisory covers extraction following
  symlinks at the destination, which the build never does — it only
  creates archives — but 0.6.1 also stops `addLocalFolder` following
  symlinks out of the folder being archived, and that is the call the
  prebuild zip step makes.
