[Chores]
- The unit test runner stays on vitest 4. Vitest 5 cannot be adopted while
  the build is on Angular 22: `@angular/build` requires `vitest ^4.0.8` and
  `@analogjs/vitest-angular` supports up to 4. Tried against 5.0.0, the
  Angular plugin stops inlining component templates and styles during
  transform, so component specs fail to compile with "is not resolved:
  styleUrls". Vite itself is not affected; the repo runs vite 8. This will
  be revisited when those packages widen their supported ranges.
