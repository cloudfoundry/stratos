[Maintainability]
- `make publish REPLACE=yes` replaces the GitHub release already on a tag in one
  invocation instead of requiring `make unpublish` first. CI runs `make publish`
  itself on a `v*` tag push, so the local target was effectively unreachable for
  a normal release — and the case that matters is CI publishing something wrong,
  which is a replacement, not a first publish. Without `REPLACE` the guard still
  refuses, and `DRYRUN=yes` prints both the delete and the create.
