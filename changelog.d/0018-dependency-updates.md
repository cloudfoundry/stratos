[Security Updates]
- `launch-editor` moved from 2.14.1 to 2.14.2 in the devkit, and its
  `vite` from 8.3.0 to 8.3.5, whose bundled copy carried the same code:

| Advisory              | What it fixes                                                |
|-----------------------|--------------------------------------------------------------|
| [GHSA-587h-7wmj-h5pm] | `fs.existsSync()` existence check can be bypassed on Windows |
| [GHSA-r825-w8mm-5pxw] | Editor CLI flag misinterpretation causing command execution  |
| [GHSA-698v-4r3x-3vcv] | `escapeCmdArgs()` omits `%` escaping on Windows              |

- `github.com/klauspost/compress` moved from 1.18.0 to 1.20.1 in the
  cfapppush plugin's module. The backend binary already built with
  1.19.1, which is not affected:

| Advisory              | What it fixes                                              |
|-----------------------|------------------------------------------------------------|
| [GHSA-259r-337f-4rfw] | Integer overflow and out-of-bounds write in the s2 decoder |

[GHSA-587h-7wmj-h5pm]: https://github.com/advisories/GHSA-587h-7wmj-h5pm
[GHSA-r825-w8mm-5pxw]: https://github.com/advisories/GHSA-r825-w8mm-5pxw
[GHSA-698v-4r3x-3vcv]: https://github.com/advisories/GHSA-698v-4r3x-3vcv
[GHSA-259r-337f-4rfw]: https://github.com/advisories/GHSA-259r-337f-4rfw

[Chores]
- Dependency updates:

| Package                              | From            | To           |
|--------------------------------------|-----------------|--------------|
| Angular (framework, CDK, CLI, build) | 22.2.1          | 22.2.3       |
| angular-eslint                       | 22.5.0          | 22.6.0       |
| marked                               | 18.0.14         | 18.1.0       |
| js-yaml                              | 5.4.2           | 5.4.3        |
| jsdom                                | 30.1.1          | 30.1.3       |
| @types/node                          | 26.6.4          | 26.6.5       |
| code.cloudfoundry.org/cli/v8         | 8.19.1 snapshot | 8.19.1       |
| code.cloudfoundry.org/clock          | 1.90.0          | 1.91.0       |
| github.com/aws/aws-sdk-go-v2         | 1.47.1          | 1.47.3       |
| github.com/prometheus/client_golang  | 1.24.1          | 1.25.0       |
| golang.org/x/crypto                  | 0.57.0          | 0.58.0       |
| golang.org/x/sync                    | 0.23.0          | 0.24.0       |
| helm.sh/helm/v3                      | 3.22.0          | 3.22.1       |
| sigs.k8s.io/aws-iam-authenticator    | 0.7.20          | 0.7.22       |
| @radix-ui/react-avatar (docs site)   | 1.2.6           | 1.3.1        |
| @radix-ui/react-slot (docs site)     | 1.3.3           | 1.5.0        |
| lucide-react (docs site)             | 1.52.0          | 1.59.0       |
| react, react-dom (docs site)         | 19.3.0          | 19.3.1       |
| postcss (docs site)                  | 8.5.29          | 8.5.30       |
| prettier (docs site)                 | 3.9.9           | 3.9.10       |
| baseline-browser-mapping (docs site) | 2.11.27         | 2.11.29      |
| caniuse-lite (docs site)             | 1.0.30001814    | 1.0.30001816 |

- aws-iam-authenticator 0.7.22 needs Go 1.27.2: four backend modules
  now declare it, and the `.tool-versions` Go pin moves to 1.27.3.
