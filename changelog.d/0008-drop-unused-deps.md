[Maintainability]
- Removed six root dependencies that nothing in the repository imports
  or runs:

| Package             | State upstream                          |
|---------------------|-----------------------------------------|
| `q`                 | archived and deprecated                 |
| `delete`            | no change since 2017                    |
| `ps-node`           | no change since 2021                    |
| `npm-run-all`       | no change since 2024; no script used it |
| `mappy-breakpoints` | no change since 2023                    |
| `kind-of`           | 2020 security pin, no longer needed     |

- `kind-of` stays at the patched 6.0.3 through `clone-deep`, which now
  requires it on its own. The lockfile loses 125 package versions and
  gains none.
