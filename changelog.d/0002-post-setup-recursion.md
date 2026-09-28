[BugFixes]
- Fixed `bun install` recursing without bound when the custom Angular
  builders had not been compiled yet. The postinstall step ran a nested
  `bun install` for the builders, which re-entered the root install and
  its postinstall. The builders are a workspace of the root package, so
  the root install already covers them and only the compile remains.
- These CommonJS build scripts are now named `.cjs` permanently. They
  used to be renamed to `.cjs` and back on every run, so an interrupted
  build or install left the tracked files deleted and untracked copies
  in their place:
  - `dev-setup`
  - `clean-symlinks`
  - `store-git-metadata`
