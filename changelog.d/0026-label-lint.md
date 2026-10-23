[Chores]
- Aligned the angular-eslint package with its plugins (22.6.0). The
  version mismatch made the template label rule report every label
  that wraps its control, 22 false warnings. Dependabot now bumps the
  package together with its plugins, and lint fails on any ESLint
  warning, so warnings can no longer pass the gate unnoticed.
