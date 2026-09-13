[Maintainability]
- Removed the `korifi` build modifier and the matching `release-cf.sh`
  mode. Korifi is retired — RFC-0060 was accepted on 2026-07-10 — and CF
  on Kubernetes is its replacement. `make build korifi` was the only
  consumer of `zig` in the build, needed for a static cgo cross-compile
  back when the sqlite driver required cgo; the pure-Go `ncruces` driver
  removed that need some time ago, so no build path asks for a C
  cross-compiler any more. The packager loses its `MODE` parameter along
  with the alternate Paketo procfile manifest it generated.
