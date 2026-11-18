[Maintainability]
- The backend no longer depends on `github.com/SermoDigital/jose`, an
  unmaintained JWT library that panics at startup under Go 1.27. It
  came in through the CF CLI libraries used for app push; the CLI now
  uses `golang-jwt` v5, so the patched fork Stratos substituted for it
  (`norman-abramovitz/fw-jose`) and both of its `replace` lines are gone.

[Chores]
- Backend dependency updates, from moving to the current CF CLI v8
  branch (untagged; the next v8 release will replace the
  pseudo-version):

| Package                         | From   | To                                   |
|---------------------------------|--------|--------------------------------------|
| code.cloudfoundry.org/cli/v8    | 8.19.0 | 8.19.1-0.20261006035801-8f3eae3b52da |
| github.com/golang-jwt/jwt/v5    | (new)  | 5.3.1                                |
| google.golang.org/grpc          | 1.83.2 | 1.84.0                               |
| code.cloudfoundry.org/tlsconfig | 0.65.0 | 0.68.0                               |
| code.cloudfoundry.org/bytefmt   | 0.86.0 | 0.92.0                               |
| github.com/sirupsen/logrus      | 1.10.1 | 1.10.2                               |
| github.com/mattn/go-runewidth   | 0.0.28 | 0.0.30                               |

- The backend linter moves from golangci-lint 2.13.1 to 2.14.0. Go
  1.27.2 writes a newer compiler export-data format that 2.13.1 cannot
  read, so `make check lint` and `make check gate` failed on any
  machine with Go 1.27.2 installed.
