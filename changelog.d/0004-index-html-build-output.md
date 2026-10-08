[BugFixes]
- Every frontend build now writes the `stratos.yaml` title, git branch,
  commit and build date into the built `index.html`. Before, the build
  rewrote the tracked source `index.html` once and later builds in the
  same checkout kept those first values. `npm run build-cf` skipped the
  step entirely.
- The source `index.html` is no longer modified by builds, and setup no
  longer hides it from `git status`. A checkout set up before this
  change may still hold an old rewritten copy; setup says so, and
  `git checkout -- src/frontend/packages/core/src/index.html` restores
  it.

[Chores]
- Removed the unused devkit `application` and `dev-server` builders.
  Their directory moved the compiled devkit under `dist-devkit/src/`,
  so `bun run prepare-backend` and the setup step that generates the
  backend plugin list could not find `dist-devkit/backend.js`. Both run
  again.
