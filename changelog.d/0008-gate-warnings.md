[BugFixes]
- The branding service no longer leaves its start-up timer and colour-scheme
  listener behind when its injector is destroyed.

[Maintainability]
- The unit run no longer ignores unhandled errors: the timer leak above and
  three kubernetes specs whose components looked up an endpoint no spec had
  seeded were the only sources, both fixed, so the flag that hid them is gone
  and the next leak fails the gate.
- The production build is warning-free: 74 template diagnostics cleared by
  fixing the types behind them rather than re-wrapping, the editor chunk
  budget lifted to 2.75 MB to match the curated Monaco 0.56 subset, and the
  monaco-yaml worker's CommonJS import acknowledged.
