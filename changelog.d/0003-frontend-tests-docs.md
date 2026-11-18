[BugFixes]
- `bun run e2e:dev` now targets the dev frontend on port 5440 instead of
  4200, where nothing listens.

[Chores]
- The developer, testing, extension and Cloud Foundry deploy guides now
  give the `make` and `bun` commands the repo uses today, and the
  frontend tests guide lists the checks a pull request runs.
- The Makefile, the tiered E2E runner and the STB workflow run their
  tools through `bun` instead of `npx` or `npm`.
- Removed the unused Code Climate configuration and script, and the
  BrowserStack instructions, which stopped working with the Protractor
  suite.
