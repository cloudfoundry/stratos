[Chores]
- Moved the frontend unit tests to Vitest 5.0.1, together with
  `@vitest/coverage-v8` and `@vitest/ui`, which Vitest 5 requires at the
  same exact version. Two changes made it work. `@oxc-project/runtime` is
  now installed, because Vitest 5 emits the decorator helper for
  decorated classes in the test setup as an import rather than inlining
  it. Each test project in `vitest.config.ts` also sets its own `root`:
  Vitest 5 ignores the root in the package config that a project extends,
  so every package would otherwise have run the whole tree without its
  Angular compiler setup. The suite results are unchanged: 666 test files
  pass and 2 are skipped.
