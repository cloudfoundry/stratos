[BugFixes: Applications]
- Adding, renaming or deleting an environment variable that Cloud
  Foundry refuses now says so, with Cloud Foundry's reason. Before,
  the dialog closed as if the change had been saved, and the variable
  list simply did not show it.

[BugFixes: Endpoints]
- Signing in with a user name and password no longer signs the
  auto-registered Cloud Foundry endpoint in again when the user is
  already connected to it. Before, every login replaced that
  connection with one made from the console credentials, even when
  the user had connected with other Cloud Foundry credentials.

[Features: Autoscaler]
- Unregistering a Cloud Foundry endpoint also unregisters the
  autoscalers linked to it.
