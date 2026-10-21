[Chores]
- Dependency updates:

| Package                     | From   | To     |
|-----------------------------|--------|--------|
| marked                      | 18.1.0 | 18.1.1 |
| js-yaml                     | 5.4.3  | 5.5.0  |
| code.cloudfoundry.org/clock | 1.91.0 | 1.92.0 |

- js-yaml 5.5.0 follows the YAML spec more strictly: a block plain
  scalar that starts with `,`, `]` or `}` is now a parse error, which
  Kubernetes kube-config registration and the Helm chart values editor
  report as invalid YAML.
