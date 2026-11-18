[BugFixes]
- When a service broker or a proxy answers with an HTML error page,
  Stratos now shows the page's heading and message, one block per line,
  instead of every word of the page run together ("502 Bad Gateway 502
  Bad Gateway nginx"). Error snackbars, the stepper and a service
  instance's "Last operation" reason show the heading in bold. Plain-text
  errors read as before.
