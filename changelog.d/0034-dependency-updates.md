[Chores]
- Dependency updates:

| Package                                      | From         | To           |
|----------------------------------------------|--------------|--------------|
| Angular CLI, build, devkit and cdk           | 22.2.3       | 22.2.5       |
| typescript-eslint                            | 8.71.0       | 8.72.1       |
| chart.js                                     | 4.5.1        | 4.6.1        |
| @playwright/test                             | 1.63.0       | 1.64.1       |
| baseline-browser-mapping                     | 2.11.31      | 2.11.34      |
| sigs.k8s.io/aws-iam-authenticator            | 0.7.23       | 0.7.24       |
| github.com/aws/aws-sdk-go-v2                 | 1.47.3       | 1.47.4       |
| baseline-browser-mapping (docs site)         | 2.11.30      | 2.11.34      |
| caniuse-lite (docs site)                     | 1.0.30001818 | 1.0.30001820 |

- aws-iam-authenticator 0.7.24 needs Go 1.27.3, so building the backend
  now needs Go 1.27.3 or later.
