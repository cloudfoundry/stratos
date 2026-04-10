# Angular 21 Upgrade — Work-in-Progress Status

**Branch:** `try/angular-21-upgrade` (worktree)
**Base:** `feature/Angular-21` at commit `2c15a7653a` (Remove 125 empty placeholder SCSS files)
**Last updated:** 2026-04-09

## TL;DR

Angular 21 is **fundamentally working**. Build succeeds, E2E passes (72/0), the
application runs correctly in a dev server against k3d. The blocker is the
**unit test infrastructure** — 234 vitest specs fail with `NG0203` because the
combination of Angular 21 + vitest 4 + zoneless change detection + NgRx Store
factory injection no longer works the way it did under Angular 20 + vitest 3.

This branch should be **kept as backup**. The actual Angular 21 upgrade is
deferred until the test infrastructure can be migrated (estimated 1–2 focused
days, or wait for `@analogjs/vite-plugin-angular` to ship full Angular 21 +
vitest 4 support).

---

## ✅ What Works

| Check | Result |
|---|---|
| `ng build stratos --configuration=development` | clean, 14.7s |
| `make check e2e` (Playwright core) | **72 passed / 41 skipped / 0 failed** |
| Dev server (vite 7 + ng serve) | runs on port 5540 |
| Manual smoke test (login → endpoints → K8s + Helm) | works end-to-end |
| Auto-migrations applied by `ng update` | 7 files migrated to control-flow syntax |

### Versions installed
| Package | Version |
|---|---|
| `@angular/core` | 21.2.8 |
| `@angular/cli` | 21.2.7 |
| `@angular/cdk` | 21.2.6 |
| `@angular/build` | 21.2.7 |
| `@angular-devkit/build-angular` | 21.2.7 |
| `@angular-builders/custom-webpack` | 21.0.3 |
| `@angular-eslint/*` | 21.0.0 |
| `@schematics/angular` | 21.2.7 |
| `@ngrx/store` (and effects, router-store, store-devtools) | 21.1.0 |
| `typescript` | 5.9.3 |
| `vite` | 7.3.2 (security CVEs all addressed) |
| `vitest` | 4.1.4 |
| `@analogjs/vitest-angular` | 2.4.4 |
| `@swimlane/ngx-graph` | 11.0.0 (peer wants CDK ≤20, works at runtime) |
| `ngrx-store-localstorage` | 20.1.0 (peer says `>=20`, works with NgRx 21) |

---

## ❌ The Blocker — `NG0203` in unit tests

### Symptom

`bun run test` produces:
```
Test Files  202 failed | 363 passed | 3 skipped (568)
     Tests  234 failed | 866 passed | 9 skipped (1109)
```

Every component-rendering test that touches NgRx Store fails with:
```
Error: NG0203: The `StateObservable` token injection failed.
`inject()` function must be called from an injection context such as a
constructor, a factory function, a field initializer, or a function used
with `runInInjectionContext`.
Find more at https://v21.angular.dev/errors/NG0203

❯ injectInjectorOnly  node_modules/@angular/core/fesm2022/_effect-chunk2.mjs:667
❯ ɵɵinject            node_modules/@angular/core/fesm2022/_effect-chunk2.mjs:684
❯ Object.factory     ng:/Store/ɵfac.js:5:49
❯ R3Injector.hydrate packages/core/src/di/r3_injector.ts:533
```

The **NgRx Store factory itself** (generated via `ɵɵngDeclareFactory`) is
running outside an active injection context. When it tries to `inject(StateObservable)`
to construct the `Store`, `getCurrentInjector()` returns `undefined` and
Angular 21 throws.

### What used to work (Angular 20 + vitest 3)

Pre-upgrade test files use this pattern:

```ts
TestBed.configureTestingModule({
  imports: [SomeStandaloneComponent],
  providers: [
    importProvidersFrom(
      CfAutoscalerTestingModule,        // declares EntityCatalogFeatureModule
      ...generateBaseTestStoreModules(), // includes StoreModule.forRoot(appReducers)
      CoreModule,
      NoopAnimationsModule,
    ),
    provideRouter([]),
    provideZonelessChangeDetection(),
    // ...
  ],
}).compileComponents();
```

Under Angular 20, `importProvidersFrom` flattened the modules' providers in
the right order: NgRx Store providers (including `StateObservable`) were in
place before any factory functions ran. Under Angular 21 the ordering breaks
— the `Store` factory is now invoked before the environment injector has
finished bootstrapping the providers it depends on.

### What was tried (and didn't fix it)

1. **Bump `@analogjs/vite-plugin-angular` and `@analogjs/vitest-angular` to 2.4.4**
   — these are the latest, peer deps say they support `vite ^6 || ^7`,
   `vitest ^1 || ^2 || ^3 || ^4`, no Angular version pinning. Installing them
   did not change the failure mode.

2. **Migrate `vitest.workspace.ts` → `vitest.config.ts` with `projects:`**
   — required because `defineWorkspace` was removed in vitest 4. The
   migration succeeded mechanically (tests are now discovered) but didn't
   change the failure mode.

3. **Replace `StoreModule.forRoot` with `provideStore` in `createBasicStoreModule`**
   — converted the helper from `ModuleWithProviders<StoreRootModule>` to
   `EnvironmentProviders` via `makeEnvironmentProviders([provideStore(...)])`.
   This **shifted** the error from `Store` to `EntityCatalogFeatureModule`,
   confirming the issue is with `importProvidersFrom` of NgModules whose
   constructors call `inject(Store)`.

4. **Convert `EntityCatalogFeatureModule` to use `provideEnvironmentInitializer`**
   — moved the `inject(Store)` / `inject(ReducerManager)` calls out of the
   module constructor and into an environment initializer that runs after
   all providers are bootstrapped. **This did not fix the test failure** —
   the same `NG0203` reappears, this time inside the Store factory itself
   when the test tries to inject Store directly.

5. **Inline `provideStore(appReducers, ...)` in a single test file's
   providers array** — removing the `importProvidersFrom` wrapping
   completely. Same `NG0203` failure. This rules out `importProvidersFrom`
   as the cause and points at a deeper interaction between the vitest 4
   test environment and Angular 21's injector-context tracking.

### Root cause hypothesis

The most likely root cause is that **`@analogjs/vite-plugin-angular`'s test
environment doesn't yet establish an injection context that survives
across NgRx 21's factory functions when running under vitest 4 + zoneless
mode**. NgRx 21's Store is now defined via `ɵɵngDeclareFactory` with
explicit `deps`, and Angular 21 enforces that factories run inside
`runInInjectorProfilerContext`. Under vitest 3 + Angular 20 the older
factory shape happened to bypass this requirement.

Notably, the **same code paths work fine in the production build and in
Playwright E2E** — the issue is specific to how vitest 4 spins up the
test environment.

---

## Files changed in this branch

### Required code changes for Angular 21 itself
| File | Change |
|---|---|
| `package.json` | Bumped Angular packages to 21, NgRx to 21.1.0, TypeScript override to ^5.9.3, vite override to ^7.3.2 |
| `tools/builders/prebuild-application/package.json` | Workspace builder bumped to 21.x |
| `vitest.config.ts` | Migrated from `defineWorkspace` to `projects:` (vitest 4 syntax) |
| `vitest.workspace.ts` | **Deleted** (removed in vitest 4) |
| `src/.../tile/tile.component.ts` | `@HostBinding('class.app-tile-1-3') private isOneThirdFixed` → `public` |
| `src/.../tile-group/tile-group.component.ts` | 7 `@HostBinding(...) private` fields → `public` |
| `src/.../tile-grid/tile-grid.component.ts` | `@Input() private fit` → `public` |

### Files updated by `ng update` automation
| File | Migration |
|---|---|
| `kubernetes-namespace-preview.component.html` | Block control flow syntax |
| `kubernetes-namespace-preview.component.ts` | Block control flow syntax |
| `stratos-title.component.ts` | Block control flow syntax |
| `custom-tabs.component.ts` | Block control flow syntax |
| `deploy-application-fs.component.ts` | Block control flow syntax |
| `cf-role-checkbox.component.ts` | Block control flow syntax |
| `add-api-key-dialog.component.ts` | Block control flow syntax |

---

## Pre-flight that confirmed the codebase was ready

Before attempting the upgrade, verified the following on `feature/Angular-21`:

| Risk area | Status |
|---|---|
| `provideZoneChangeDetection` already in `app.module.ts` | ✓ |
| No `NgModuleFactory` usage | ✓ |
| No `moduleId` on components | ✓ |
| No `UpgradeAdapter` (legacy upgrade) | ✓ |
| No custom interpolation delimiters | ✓ |
| No `lastSuccessfulNavigation` consumers | ✓ |
| 62 `[ngClass]` + 6 `[ngStyle]` bindings | left as-is — auto-migration available, low risk |
| TypeScript 5.8 → 5.9 | bumped via override |
| Gate check passed on base branch | 1104 tests, all green |
| E2E passed on base branch | 72 passed, 41 skipped, 0 failed |

---

## What surfaced as Angular 21 breaking changes that hit our code

| # | Breaking change | Files affected | Fix applied |
|---|---|---|---|
| 1 | Host binding type checking enabled by default — can't bind to `private` fields | `tile/`, `tile-group/`, `tile-grid/` | Made fields `public` |
| 2 | `@Input() private` similarly rejected | `tile-grid/` | Made `public` |
| 3 | TypeScript 5.9 minimum | `package.json` overrides | Bumped override |
| 4 | `@angular/build@^20` not compatible | resolved version | Forced override to `^21.2.7` |
| 5 | NgRx Store factory injection context (test env) | All component specs touching Store | **NOT FIXED** — see blocker section |

---

## How to resume this work

### Option A — wait for tooling

Watch these for vitest 4 + Angular 21 + zoneless support:
- `@analogjs/vite-plugin-angular` releases
- `@analogjs/vitest-angular` releases
- vitest 4 documentation on Angular testing

When the toolchain is ready, this branch can be rebased onto the latest
`feature/Angular-21` and the test failures should resolve without further
code changes.

### Option B — invest the focused day

The fix likely requires one of:

1. **Custom test bootstrap** that wraps every spec in `runInInjectionContext`
   — would need a vitest plugin or a global beforeEach that initializes
   TestBed's environment injector before any factory runs.

2. **Migrate every spec away from `importProvidersFrom`** of modules whose
   constructors `inject()`, replacing them with explicit `provide*` calls
   in the providers array. This is mechanical but touches ~200 spec files
   and the test framework helpers (`generateBaseTestStoreModules`,
   `BaseTestModules`, etc.).

3. **Stop using zoneless in tests** — switch back to `provideZoneChangeDetection`
   for tests only. May or may not avoid the issue depending on how vitest 4
   spins up the platform.

### Option C — abandon and revisit later

Drop this branch and stay on Angular 20 (`feature/Angular-21` branch — yes,
the name is misleading; it has been the long-running work branch for the
Angular 21 prep work but currently sits at Angular 20.3.18). All the
Angular 21 readiness work landed on `feature/Angular-21` already and the
codebase will continue to work fine on Angular 20 until the tooling
catches up.

---

## Resuming step-by-step

To resume work in this worktree:

```bash
cd /Users/norm/Projects/CloudFoundry/cf-stratos-ng21
git status  # should be clean on try/angular-21-upgrade
git pull origin try/angular-21-upgrade

# Reinstall dependencies (worktree might have stale node_modules)
rm -rf node_modules bun.lock
bun install

# Verify build still works
npx ng build stratos --configuration=development

# Verify E2E still passes
make check e2e

# To work on the test infrastructure issue, start with one spec:
npx vitest run \
  src/frontend/packages/cf-autoscaler/src/shared/list-types/app-autoscaler-metric-chart/app-autoscaler-metric-chart-card/combo-chart/combo-series-vertical.component.spec.ts \
  --project=cf-autoscaler
```

### Files to look at first when resuming

| File | Why |
|---|---|
| `src/frontend/packages/store/testing/src/store-test-helper.ts` | `createBasicStoreModule` — currently uses `StoreModule.forRoot`, may need migration to `provideStore` |
| `src/frontend/packages/store/src/entity-catalog.module.ts` | `EntityCatalogFeatureModule` constructor injects `Store` — candidate for `provideEnvironmentInitializer` migration |
| `src/frontend/packages/core/test-framework/core-test.helper.ts` | `generateBaseTestStoreModules` — entry point for most test setups |
| `src/frontend/packages/*/src/test-setup.ts` | Per-package vitest test setup files — initialize TestBed platform |
| `vitest.config.ts` | Already migrated to vitest 4 `projects:` syntax |

---

## Pointers to the original Angular 20 baseline

If the upgrade is abandoned, the prep work is fully landed on
`feature/Angular-21` (still at Angular 20.3.18) and is in excellent shape.
Ship-ready commits since 2026-04-09:

| Commit | Description |
|---|---|
| `2c15a7653a` | Remove 125 empty placeholder SCSS files across packages |
| `51040a07e7` | FWT-872: Remove 34 empty K8s placeholder SCSS files |
| `3c94ee4e66` | FWT-872: Convert helm/monocular SCSS to Tailwind, remove dead code (-966 lines) |
| `a0b3bfa8ad` | Fix Helm chart browsing broken by standalone migration |
| `698aa8daaf` | Pin patched hono and vite via overrides (security CVEs) |
| `217f9e24ac` | FWT-876: Reduce ESLint unused-vars warnings 532 to 5 |
| `23cdbd2c97` | Fix TS build errors from inject() migration |
| `0085038667` | ESLint: ignore _-prefixed caught errors and spec vars |
