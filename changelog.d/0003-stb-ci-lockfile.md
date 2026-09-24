[Chores]
- The Stratos Theme Builder's CI job installs from `tools/stb/bun.lock`
  with `bun install --frozen-lockfile` instead of `npm install`, which
  ignored the lockfile and resolved every dependency fresh. The
  lockfile also drops stale nested CodeMirror copies that failed
  typecheck when installed as locked.
