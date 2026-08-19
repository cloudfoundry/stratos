[Maintainability]
- The Monaco editor now ships as a curated feature-and-language subset
  (core editor, json language service, yaml tokenizer) instead of the
  full build with ~80 bundled languages: the editor-open payload drops
  from 868KB to 785KB gzipped and the built frontend loses 800KB of
  never-used language modules. The subset also prefetches once the
  browser goes idle after bootstrap, so the first editor surface opens
  without paying the chunk fetch at click time. A bundle budget now
  fails the build if the chunk regresses toward the full build.
