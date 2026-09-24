[Chores]
- Dependency updates: `typescript-eslint` from 8.70.0 to 8.70.1. The root
  manifest no longer declares `@typescript-eslint/eslint-plugin` and
  `@typescript-eslint/parser` separately. The lint configuration only
  uses the `typescript-eslint` package, which brings both, and the
  separate pins kept an older copy of the whole family in the lockfile
  whenever `typescript-eslint` moved on its own.
