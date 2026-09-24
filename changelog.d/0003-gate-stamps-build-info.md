[Chores]
- `make check gate`, `make check tests` and `make check coverage`
  generate `build-info.ts` when it is missing, as CI already does before
  its tests. In a fresh clone or worktree the unit tests previously
  failed to resolve it; an existing file is left untouched.
