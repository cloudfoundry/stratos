[Chores]
- Dependency updates: `typescript-eslint` from 8.70.0 to 8.70.1.
- The lint configuration uses only the `typescript-eslint` package,
  which brings its parser and plugin, so the root manifest no longer
  declares them separately. The separate pins kept an older copy of the
  whole family in the lockfile whenever `typescript-eslint` moved on its
  own:
  - `@typescript-eslint/eslint-plugin`
  - `@typescript-eslint/parser`
