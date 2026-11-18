[BugFixes]
- Deploying an application from a Git repository or folder no longer fails
  when the source has no `manifest.yml`. Like `cf push <name>`, the deploy
  warns and continues with a manifest generated from the application name
  entered in the wizard. Without a manifest or a name it now says so,
  instead of a generic "Deploy Failed!" (#5987).
- A failed application deploy now keeps showing the specific reason
  (invalid manifest, missing endpoint, ...). A generic "Deploy Failed!"
  sent after it no longer replaces it.
- Route lists (an application's Routes tab, and the Cloud Foundry and
  space Routes pages) show each route's full URL as a link with a copy
  button, in card and table view. TCP routes copy as host:port. Route
  URLs now show `https://`, matching the Visit button.
