[Chores]
- Dependency updates:

| Package                                        | From         | To           |
|------------------------------------------------|--------------|--------------|
| Angular                                        | 22.2.4       | 22.2.5       |
| Angular CLI and build                          | 22.2.5       | 22.2.6       |
| @angular/cdk                                   | 22.2.5       | 22.2.7       |
| @analogjs/vite-plugin-angular, vitest-angular  | 2.9.6        | 2.9.7        |
| vitest, @vitest/coverage-v8, @vitest/ui        | 5.0.5        | 5.1.0        |
| tailwindcss, @tailwindcss/postcss              | 4.3.3        | 4.3.5        |
| ng-packagr                                     | 22.2.4       | 22.2.6       |
| baseline-browser-mapping                       | 2.11.34      | 2.11.35      |
| github.com/ncruces/go-sqlite3                  | 0.36.0       | 0.37.0       |
| go.yaml.in/yaml/v4                             | 4.0.0-rc.7   | 4.0.0        |
| golang.org/x/sync                              | 0.24.0       | 0.25.0       |
| code.cloudfoundry.org/clock                    | 1.94.0       | 1.95.0       |
| github.com/aws/aws-sdk-go-v2                   | 1.47.5       | 1.47.8       |
| lucide-react (docs site)                       | 1.68.0       | 1.70.0       |
| tailwindcss (docs site)                        | 4.3.3        | 4.3.5        |

- go-sqlite3 0.37.0 starts `database/sql` transactions with
  `BEGIN IMMEDIATE`. In this code base only the schema migrations at
  startup open transactions.
- go.yaml.in/yaml/v4 moves from a release candidate to 4.0.0.
