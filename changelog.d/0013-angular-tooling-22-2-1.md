[Chores]
- Frontend dependency updates:

| Package                                                 | From     | To       |
|---------------------------------------------------------|----------|----------|
| `@angular/build`, `@angular/cli`, `@schematics/angular` | 22.2.0   | 22.2.1   |
| `@angular-devkit/build-angular`, `core`, `schematics`   | 22.2.0   | 22.2.1   |
| `@angular-devkit/architect`                             | 0.2202.0 | 0.2202.1 |
| `ng-packagr`                                            | 22.2.3   | 22.2.4   |
| `baseline-browser-mapping`                              | 2.11.26  | 2.11.27  |

- The Angular build tooling now matches the 22.2.1 framework, in the
  root and devkit manifests alike.
- `rollup` leaves the root lockfile. Nothing depended on it; the
  toolchain builds with `rolldown`.
