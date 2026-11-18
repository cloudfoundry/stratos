[Chores]
- `make bump set TO=<version>` sets an exact version, the way the
  other bumps run, and honours `DRYRUN=yes`. Version bumps now stamp
  this repository's commit SHA even when run from another directory;
  before, they stamped whatever repository the shell was in.
  `src/jetstream/VERSION` now gets the version exactly as
  `package.json` does, with or without a `v`. The version-bump tests
  pass again, and the duplicate copy under `test/` is gone.
