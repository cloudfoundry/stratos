[BugFixes]
- The home page's recently updated applications show each app's real
  state. A started app showed a green circle, read as "Deployed, No
  Instances", which turned gray a few seconds later once the console
  learned its instance count. The list now carries each app's instance
  count and loads its instance stats, so a running app shows green;
  while the stats load, the row shows a loading placeholder.
