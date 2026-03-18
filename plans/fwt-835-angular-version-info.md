# FWT-835: Add Angular/TypeScript version info to About + Diagnostics

## Status: Complete

## Summary

Added Angular version to About page Frontend section and Angular/TypeScript/Node/Bun
versions to Diagnostics page Runtime Versions card. Fixed faded home page counts
regression and broken E2E test locators.

## Changes

### version.mk
- Added `BUILD_NODE_VERSION`, `BUILD_TS_VERSION`, `BUILD_BUN_VERSION` variables
- Extended `fe-version` target to include these in generated `build-info.ts`

### About page
- `about-page.component.ts`: Import `VERSION` from `@angular/core`, expose `angularVersion`
- `about-page.component.html`: Angular version row after Branch in Frontend section

### Diagnostics page
- `diagnostics-page.component.ts`: Import `VERSION` and `BUILD_INFO`
- `diagnostics-page.component.html`: Runtime Versions card (Angular/TS/Node/Bun)
- Build Date now uses `BUILD_INFO` with same date pipe format as About page

### Bug fixes
- `card-number-metric.component.html`: `text-gray-900` → `text-content-text` to fix
  faded counts on home page (Angular 20 upgrade regression)

### Tests
- `about-page.component.spec.ts`: Added `angularVersion` semver assertion
- `about-page.spec.ts` (E2E): Fixed all broken `app-metadata-item` locators to use
  `dt`/`dd` matching actual template; added Angular version test

## Related
- FWT-811: UI enhancement umbrella
- Separate ticket needed: raw gray → semantic color sweep (~40+ templates)
