[Security Updates]
- `source-map-js` moved from 1.2.1 to 1.2.2 in the frontend build, the
  devkit, the docs site and STB:

| Advisory              | What it fixes                                                           |
|-----------------------|-------------------------------------------------------------------------|
| [GHSA-68fv-2mgg-jv7q] | Event-loop denial of service through indexed source-map section offsets |

[GHSA-68fv-2mgg-jv7q]: https://github.com/advisories/GHSA-68fv-2mgg-jv7q

[Chores]
- Dependency updates:

| Package                              | From         | To           |
|--------------------------------------|--------------|--------------|
| eslint                               | 10.11.0      | 10.12.0      |
| @types/node                          | 26.6.3       | 26.6.4       |
| go-cfenv                             | 1.24.3       | 1.24.4       |
| code.cloudfoundry.org/clock          | 1.89.0       | 1.90.0       |
| postcss (docs site)                  | 8.5.28       | 8.5.29       |
| lucide-react (docs site)             | 1.48.0       | 1.52.0       |
| baseline-browser-mapping (docs site) | 2.11.26      | 2.11.27      |
| caniuse-lite (docs site)             | 1.0.30001812 | 1.0.30001814 |

- The Go update also moves the backend's indirect Kubernetes client
  libraries from 0.36.4 to 0.37.1, and the `golang.org/x` packages.
- Removed the unused `browserstack-local` development dependency.
