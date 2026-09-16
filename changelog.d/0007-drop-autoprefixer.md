[Maintainability]
- Removed `autoprefixer` from the root manifest. The Tailwind v4 migration
  dropped it from the PostCSS plugin list and left the dependency entry
  behind, so nothing had resolved it since. The application builds through
  `@angular/build`, which carries no autoprefixer reference at all — vendor
  prefixing comes from esbuild, whose target is derived from the
  browserslist file. Removing the entry also collapses a duplicate
  resolution: autoprefixer now appears once, as the build tooling's own
  transitive dependency, instead of twice at two versions. The emitted
  stylesheet is byte-identical with and without it.
