[Chores]
- Build this release line with Go 1.26. Under Go 1.27 jetstream compiles
  cleanly and then panics before `main`: the unmaintained
  `SermoDigital/jose`, reached through the CF CLI, registers an invalid
  hash id from an init function. The forked dependency that fixes this
  is on the 5.5 line only. Note that `GOTOOLCHAIN=auto` does not help —
  it only ever upgrades, so a newer installed toolchain wins over the
  `go 1.26.3` directive in `go.mod`; build with
  `GOTOOLCHAIN=go1.26.3+auto`. Released binaries are unaffected, as CI
  builds this line with Go 1.26.
