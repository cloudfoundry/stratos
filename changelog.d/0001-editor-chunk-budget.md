[Chores]
- The production build now fails on any warning that is not listed, with
  a reason, in `scripts/build-warnings-allowed.mjs`. Listed warnings still
  print on every build. This is what let the Monaco 0.57 bump push the
  editor chunk past its size budget unnoticed; that budget is now 2.85 MB.
- `make build release cf` no longer warns that frontend and backend are
  not valid modifiers for release; only modifiers you type are checked.
- The project's own build, lint, release and CI scripts run with bun
  instead of calling `node` directly. Node remains the runtime for the
  Angular CLI and vitest; the version check now reports the Node on PATH
  rather than bun's built-in Node compatibility version.
