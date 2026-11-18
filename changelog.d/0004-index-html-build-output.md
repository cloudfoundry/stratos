[Maintainability]
- Removed unused build tooling: `stratos-buildpack.yml`,
  `deploy/cloud-foundry/build.sh` and `deploy/cloud-foundry/start.sh`.
  They served the old custom Stratos buildpack, which built Stratos from
  source during `cf push`. Stratos no longer deploys that way: the Cloud
  Foundry deploy pushes the pre-built `stratos-cf-<version>.zip` with
  the `binary_buildpack` and never runs these files. Nothing changes for
  a deploy that follows the current instructions.
- The last release that has them is v5.5.5. To restore them:
  `git checkout v5.5.5 -- stratos-buildpack.yml deploy/cloud-foundry/build.sh deploy/cloud-foundry/start.sh`

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
- Release builds now record the release tag as the branch, so the
  About page shows the tag (such as `v5.5.5`) rather than `HEAD`. Release CI checks out
  the tag, which leaves no branch; a build from a checkout with no
  branch and no tag records the short commit.

[Chores]
- Removed the unused devkit `application` and `dev-server` builders.
  Their directory moved the compiled devkit under `dist-devkit/src/`,
  so `bun run prepare-backend` and the setup step that generates the
  backend plugin list could not find `dist-devkit/backend.js`. Both run
  again.
