[Chores]
- `make audit backend` and `make audit tests` reported success when the gosec
  scanner had not run at all. gosec exits non-zero both when it finds issues
  and when it cannot start, and every invocation tolerated failure so findings
  stayed advisory — which also hid a scanner built against an older Go
  aborting on every package. Findings remain advisory; a scanner that did not
  run is now an error naming the cause and the rebuild command.
