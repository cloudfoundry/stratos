[BugFixes]
- The UAA token endpoint is now checked at the point the request is made,
  rather than trusted from wherever it was built. It must be an absolute
  http(s) URL with a plain host and path — no user info, query or
  fragment. The first-run setup form supplies this value on an
  unauthenticated request, so an unconfigured console could be pointed at
  an arbitrary URL of a caller's choosing.
