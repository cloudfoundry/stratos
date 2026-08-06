[Chores]
- Monaco editor is lazy-loaded and bundled through the Angular build as ESM, and assets were right-sized, with load diagnostics added to measure it (#5560, #5651). Per-space enrichment is skipped on the prewarm drain when nothing consumes it (#5614), and endpoint catalogs the endpoint has already loaded are no longer refetched (#5700).
