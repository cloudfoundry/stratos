[BugFixes: Metrics]
- A Cloud Foundry cell's Summary page opens again; it failed to load.
- A cell's App Instances list shows the cell's applications; it always
  read "There are no applications".
- A cell's health history lists the past hour's samples; it always read
  "Cell has no health history".
- A cell metrics request that fails shows its reason: the cell lists
  show "Failed to load" with Retry, and the cell page an error above its
  tabs. A cell with no health sample reads "Unknown", not a red ERROR
  and "Healthy: No".
- An application's instances list shows its Cell column again (each
  instance's cell, linked to the cell's page) when the Cloud Foundry has
  cell metrics.
