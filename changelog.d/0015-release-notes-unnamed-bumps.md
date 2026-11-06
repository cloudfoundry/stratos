[Chores]
- `release-notes.sh check` (also run by `make changelog` and `make stamp
  tag`) now notes each bumped package that no fragment names. A later
  dependency fragment no longer hides an earlier bump it never described.
