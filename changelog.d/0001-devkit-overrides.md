[Maintainability]
- Moved the devkit's build tooling to 22.2.0 and removed the npm
  overrides in its manifest. The overrides were added to force patched
  versions past dependency alerts, but the tooling had since moved
  beyond them, so they were forcing older releases onto it:

| Package            | Forced by the overrides | Declared by the tooling |
|--------------------|-------------------------|-------------------------|
| vite               | 7                       | 8                       |
| Babel              | 7                       | 8                       |
| webpack-dev-server | 5                       | 6                       |

- The vite pin also kept a vulnerable esbuild in the devkit lockfile
  (GHSA-g7r4-m6w7-qqqr, low). Without the overrides the devkit resolves
  the versions its tooling declares, and npm audit reports no
  vulnerabilities.
