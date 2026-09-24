[Chores]
- Added `scripts/lockdiff.mjs`, which explains a lockfile change by
  package instead of by line: what was added, removed, re-versioned or
  only moved, and which changed package brought each one in. It reads
  `bun.lock` and npm `package-lock.json`. `docs/build-and-packaging.md`
  describes the stepwise update procedure it supports, which keeps
  lockfile regeneration as a last resort.
