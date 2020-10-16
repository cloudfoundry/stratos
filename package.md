# Package file notes

- 01 Apr 2020 - Added `kind-of` (^6.0.3) as a dev dependency to address security issue with 6.0.2. Can be removed when referencing package is updated.
- 06 Oct 2020 - Added `lodash` (^4.17.20) as a dependency to fix Snyk failing due to dagre@0.8.5 --> lodash@4.17.19 (which is only set in master, not 0.8.5). We should check before next release that this is still needed.
