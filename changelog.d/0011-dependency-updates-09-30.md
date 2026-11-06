[Security Updates]
- fast-uri moved to 3.1.8: from 3.1.5 in the root and website manifests,
  and from 3.1.7 in the devkit. It reaches the UI through ajv, which the
  schema widget uses to validate JSON schemas. 3.1.5 was affected by all
  three advisories:

| Advisory              | Severity | What it fixes                                                      |
|-----------------------|----------|--------------------------------------------------------------------|
| [GHSA-5jgf-p345-68v8] | High     | Host confusion via skipped IDN canonicalization on scheme-relative references |
| [GHSA-qw65-cvwx-89v3] | High     | Authority injection through an unvalidated port when serializing   |
| [GHSA-hrr3-gc8f-f4qj] | Medium   | Inconsistent host case normalization via percent-encoded octets    |

[GHSA-5jgf-p345-68v8]: https://github.com/fastify/fast-uri/security/advisories/GHSA-5jgf-p345-68v8
[GHSA-qw65-cvwx-89v3]: https://github.com/fastify/fast-uri/security/advisories/GHSA-qw65-cvwx-89v3
[GHSA-hrr3-gc8f-f4qj]: https://github.com/fastify/fast-uri/security/advisories/GHSA-hrr3-gc8f-f4qj

[Chores]
- Frontend dependency updates:

| Package                    | From     | To       |
|----------------------------|----------|----------|
| `marked`                   | 18.0.12  | 18.0.14  |
| `ng-packagr`               | 22.1.1   | 22.2.1   |
| `jsdom`                    | 30.0.1   | 30.1.1   |
| `happy-dom`                | 20.14.0  | 20.14.5  |
| `sass`                     | 1.104.0  | 1.105.0  |
| `@oxc-project/runtime`     | 0.121.0  | 0.151.0  |
| `@types/node`              | 26.4.1   | 26.6.3   |
| `fs-extra`                 | 11.4.0   | 11.4.1   |
| `browserstack-local`       | 1.5.14   | 1.5.15   |
| `baseline-browser-mapping` | 2.11.25  | 2.11.26  |

- The `marked` pin in `src/frontend/packages/core/package.json` moved
  with the root, as the nested manifest pin check requires.
- Website dependency updates:

| Package                    | From         | To           |
|----------------------------|--------------|--------------|
| `react`, `react-dom`       | 19.2.8       | 19.3.0       |
| `lucide-react`             | 1.28.0       | 1.48.0       |
| `tailwind-merge`           | 3.6.0        | 3.7.0        |
| `postcss`                  | 8.5.25       | 8.5.28       |
| `prettier`                 | 3.9.6        | 3.9.9        |
| `caniuse-lite`             | 1.0.30001806 | 1.0.30001812 |
| `baseline-browser-mapping` | 2.11.10      | 2.11.26      |
