[Maintainability]
- Pin drift between the frontend package manifests and the root manifest
  now fails the lint check instead of being found later. The files under
  `src/frontend/packages/` install nothing, but Dependabot security
  updates scan every manifest in the repository regardless of the
  directory list in `dependabot.yml`, so a pin left behind the shipped
  tree raises advisories against packages that already ship at a patched
  version. That had been corrected by hand three times. Four non-Angular
  pins that the manual syncs never covered — `core-js`, `marked` and the
  two `@analogjs` packages — were brought into line at the same time.
