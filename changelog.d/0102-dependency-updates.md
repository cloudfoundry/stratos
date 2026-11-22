[Chores]
- Dependency updates:

| Package                                        | From         | To           |
|------------------------------------------------|--------------|--------------|
| Angular, CLI, build, cdk, aria, ng-packagr     | 22.2.6       | 22.3.0       |
| angular-eslint                                 | 22.6.0       | 22.8.0       |
| vitest, @vitest/coverage-v8, @vitest/ui        | 5.1.0        | 5.1.1        |
| @playwright/test                               | 1.64.1       | 1.65.1       |
| core-js                                        | 3.50.0       | 3.51.0       |
| marked                                         | 18.1.1       | 18.2.1       |
| tslib                                          | 2.8.1        | 2.9.1        |
| eslint                                         | 10.14.0      | 10.15.0      |
| typescript-eslint                              | 8.72.1       | 8.73.0       |
| sass                                           | 1.107.1      | 1.108.2      |
| sass-loader                                    | 17.0.1       | 17.1.1       |
| jsdom                                          | 30.1.3       | 31.0.1       |
| github.com/labstack/echo/v5                    | 5.4.4        | 5.4.7        |
| golang.org/x/crypto                            | 0.58.0       | 0.59.0       |
| github.com/go-sql-driver/mysql                 | 1.10.1       | 1.10.2       |
| github.com/ncruces/go-sqlite3                  | 0.37.0       | 0.38.0       |
| code.cloudfoundry.org/clock                    | 1.95.0       | 1.97.0       |
| github.com/aws/aws-sdk-go-v2                   | 1.47.8       | 1.48.0       |
| github.com/aws/aws-sdk-go-v2/config            | 1.33.16      | 1.33.21      |
| github.com/aws/aws-sdk-go-v2/credentials       | 1.20.16      | 1.21.3       |
| github.com/aws/aws-sdk-go-v2/service/sts       | 1.51.9       | 1.53.0       |
| Go (development pin)                           | 1.27.3       | 1.27.4       |
| Node.js (development pin)                      | 26.2.0       | 26.13.1      |
| Bun                                            | 1.3.14       | 1.4.5        |
| lucide-react (docs site)                       | 1.70.0       | 1.77.0       |
| tailwind-merge (docs site)                     | 3.7.0        | 3.7.1        |
| prettier (docs site)                           | 3.9.10       | 3.10.1       |

- TypeScript stays on 6.0: Angular 22.3.0 supports `>=6.0 <6.1`, so
  TypeScript 7 waits for a later Angular release.
- Contributors need Bun 1.4.5 (`package.json` engines `>=1.4.5`).
