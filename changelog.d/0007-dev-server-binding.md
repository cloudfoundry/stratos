[BugFixes]
- The dev server binds all interfaces explicitly. Without a `--host`,
  `ng serve` picks its own loopback binding and can come up IPv6-only,
  which reads as connection refused to anything resolving localhost to
  127.0.0.1.
