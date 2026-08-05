[Security Updates]
- Three fixable CVEs were patched across the Jetstream modules in the shipped backend tree: `golang.org/x/text` 0.37.0 to 0.39.0 (CVE-2026-56852), `golang.org/x/net` 0.55.0 to 0.56.0 (CVE-2026-46600) and `oras.land/oras-go` 2.6.1 to 2.6.2 (CVE-2026-50163) (#5754).

[Chores]
- Cleared the outstanding frontend advisories — three critical and twenty-seven high, all in the build chain rather than the shipped bundle — mostly as floor raises through overrides (#5754). The website is a separate workspace with its own lockfile and had no overrides block, so none of the root pinning reached it; seven pins cleared the ten high advisories there (#5754).
- The devkit `undici` override moved to 7.29.0. The pin at 7.28.0 had itself been a security fix, but that version had since become the vulnerable range for five further advisories, and the pin was what blocked the upgrade (#5754).
- `@babel/core` was collapsed onto the already-patched copy. `istanbul-lib-instrument` resolved 7.28.3, inside the `sourceMappingURL` arbitrary-file-read advisory, while every other consumer already pinned 7.29.7 — so the tree carried two copies and only one was patched (#5754).
- Angular moved from 22.0.1 to 22.0.8 (#5747), `fast-uri` was bumped in the devkit package (#5748), and the website group took `baseline-browser-mapping`, `lucide-react` and `postcss` (#5749), then `baseline-browser-mapping` 2.11.10 (#5757).
