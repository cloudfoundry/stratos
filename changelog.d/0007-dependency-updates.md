[Chores]
- Frontend dependencies moved to their current releases: Angular and the
  Angular CLI to 22.1.x, `marked` 16 to 18, `js-yaml` 4 to 5, `sass-loader`
  13 to 17 and `@playwright/test` to 1.62. The Angular devkit packages have
  to move as a set, and `@angular-devkit/build-angular` had to be carried
  with them by hand: it is deprecated at every published version, and
  Dependabot filters deprecated releases out of the candidate list, so it
  cannot bump that one package while bumping its siblings. Leaving it behind
  resolves two copies of `@angular-devkit/architect` and the devkit builders
  stop type-checking.
- Two build scripts imported `js-yaml` through a default export that
  version 5 no longer provides, and failed at module load.
- The frontend test matrix in CI listed seven of the eight vitest projects,
  so the `cf-autoscaler` specs ran locally and never in CI.

[BugFixes]
- The JSON schema form no longer emits a `<form>` inside a `<form>`. The
  renderer recurses into itself for nested object schemas and rooted every
  level in a form element, which is invalid HTML — the DOM API builds it
  anyway, and browsers scope submission and reset in ways the markup did
  not intend. Nothing in that template submits, so it is a plain container.
