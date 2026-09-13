[Chores]
- Added live-foundation tests for endpoint capability detection. A Cloud
  Foundry with the V2 API disabled still answers 200 from `/v2/info`, so the
  behaviour could not be reproduced from fixtures and had to be confirmed
  against real foundations. Each test skips unless its foundation is named in
  `STRATOS_LIVE_CF` or `STRATOS_LIVE_CF_V2OFF`, so an ordinary test run is
  unaffected, and the expectations are read from what the foundation itself
  advertises rather than any particular installation's values.
