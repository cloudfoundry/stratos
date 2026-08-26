[Maintainability]
- Jetstream now logs entirely through `log/slog`. Echo v5 had already
  moved to slog, which left the backend running two loggers with two
  formats and two level settings; a bridge kept them on one stream
  during the transition and is now gone. All nine Go modules are
  converted, and no first-party code imports logrus anywhere. Log
  messages are structured records rather than formatted strings, so
  identifiers that used to be interpolated into message text — user,
  endpoint and token GUIDs, org and space, chart and release names —
  are now attributes that can be filtered and correlated. `LOG_LEVEL`
  and `LOG_TO_JSON` behave as before, and every level name logrus
  accepted still works, including `trace`, `fatal` and `panic`.

[BugFixes]
- A `LOG_LEVEL` typo used to silence the backend almost completely.
  logrus returned its panic level for an unrecognised name and the
  error was discarded, so `LOG_LEVEL=inof` suppressed nearly every
  message. An unusable value is now reported and the current level
  kept.
- Under `LOG_TO_JSON`, the log level line and the API request log each
  emitted a record with a duplicate key, because both passed an
  attribute named for a key slog writes itself. Decoders generally take
  the last occurrence, so an aggregator read the configured level
  string in place of the record's real severity, and the request start
  time in place of the record timestamp.
- Deploying an application from a private Git repository wrote the
  supplied access token to the debug log. The source information line
  logged the whole client message, whose payload carries the token.
  Only the source type is logged now.
- Several failures were reported as success or reported without a
  cause: a Helm chart icon whose cache folder could not be created was
  returned as a valid path, a truncated chart archive was served as
  though it had extracted cleanly, an analysis report that failed to
  serialise returned HTTP 200, and both analysis runners logged
  completion before checking whether the run had failed.
- Two paths that could dereference a nil pointer are fixed: the Helm
  client stored a configuration it had already failed to build, and the
  Kubernetes dashboard proxy used a URL it had failed to parse.
- Numerous log lines that named the wrong function, shared one message
  between unrelated failures, or discarded the error they were
  reporting now identify what actually happened.

[Chores]
- `make check lint` runs the Go linters again. golangci-lint supports
  only a Go version at or below the one that built it, so the Go 1.27
  bump left the packaged binary failing before it reached any linter.
  It is now pinned and built from source against the toolchain named in
  `go.mod`.
