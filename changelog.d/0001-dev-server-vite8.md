[BugFixes]
- Fixed `ng serve` bootstrapping to a blank page with "The injectable
  '_PlatformLocation' needs to be compiled using the JIT compiler". The `vite`
  entry in `overrides` was still pinned to the v7 line the Angular 21 upgrade
  needed, which forced `@angular/build` 22.1 down off the v8 it now requires.
  Vite 7 ignores the `rolldownOptions` the builder uses to register its
  dependency-optimizer plugin, so the Angular linker never ran and the
  prebundled framework packages kept their partial declarations. Production
  builds were unaffected — they link through a different path.
