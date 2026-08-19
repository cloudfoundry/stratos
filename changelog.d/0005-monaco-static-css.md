[BugFixes]
- Monaco's static widget styles finally reach the page: the builder
  bundles the CSS monaco imports from JS into chunk .css files, but
  nothing attaches those for a plain dynamic import() — since the ESM
  switch the editor has rendered on runtime-injected styles and
  browser defaults (visible with monaco 0.56 as a naked IME textarea
  inside the editor and a chromeless find widget). The subset's CSS is
  now built as a stable non-injected "monaco" styles bundle that the
  loader links when the editor loads.
