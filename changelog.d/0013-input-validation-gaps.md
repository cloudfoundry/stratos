[BugFixes]
- Jetstream crashed at startup when `ENCRYPTION_KEY_VOLUME` was configured
  without `ENCRYPTION_KEY_FILENAME`. The filename was indexed before being
  checked, so an empty one raised an index-out-of-range panic, and the guard
  meant to require both settings only rejected the case where neither was
  given. That combination is what the DevOps guide's own example showed. An
  empty filename is now a clear error.
- Terminal dimensions sent by the browser to the application SSH session were
  used without validation, so a negative value wrapped to a very large one and
  an oversized value was truncated when converted for the window-change
  request. Rows and columns are now clamped to a sensible range.
