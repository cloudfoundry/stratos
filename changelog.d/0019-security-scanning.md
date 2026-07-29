[Security Updates]
- Jetstream gained SSRF and path-traversal guards, and its build-chain dependencies were patched (#5624). The remaining high and medium CodeQL alerts were resolved (#5629) and the outstanding Dependabot alerts cleared (#5630).
- The unmaintained `mholt/archiver/v3` was replaced with `mholt/archives` (#5620).

[Chores]
- Adopted zizmor, osv-scanner, gitleaks and CodeQL as standing scanners (#5616), added a golangci-lint gate and expanded the audit tooling (#5633), and added a dependency-archival audit target (#5683).
