[Maintainability]
- Fixed a rare false failure in the jetstream CSP route test. Its sentinel for
  the raw static file was `RAW`, which is spellable in the base32 alphabet the
  nonce generator draws from, so roughly one run in a thousand found it inside
  a nonce and reported that the static handler had won when the document had in
  fact been served and nonced correctly.
