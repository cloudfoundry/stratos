[Chores]
- These targets generate `build-info.ts` when it is missing, as CI
  already does before its tests:
  - `make check gate`
  - `make check tests`
  - `make check coverage`
- In a fresh clone or worktree the unit tests previously failed to
  resolve it. An existing file is left untouched.
