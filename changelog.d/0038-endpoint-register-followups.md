[BugFixes: Endpoints]
- With several admin Cloud Foundry endpoints at the auto-registered
  URL, logging in reconnects the one the user is connected to. With
  none, it connects the auto-registered endpoint, named by
  `AUTO_REG_CF_NAME` or "Cloud Foundry"; before, it connected whichever
  one the database returned first. A user who disconnected it is still
  left disconnected.
- The endpoints page reloads the endpoint list before each 30-second
  health check. A connection dropped elsewhere, such as in another tab
  or by an admin, stayed listed as Connected, and every check of it was
  refused.
- Registering an endpoint of a type the server does not know, or with
  no type, says "This Stratos server cannot register endpoints of type
  "<type>" yet" instead of "Internal Server Error (500)".
- The Cloud Foundry Autoscaler tile in Register Endpoint has the
  Autoscale icon and comes after Cloud Foundry; it had the Cloud
  Foundry icon and came first, so it was picked by mistake.
- Icons on the Register Endpoint and Backup/Restore Endpoints tiles
  are drawn at the size of the other tiles' logos; the Autoscaler,
  Backup and Restore icons were a fraction of it.
