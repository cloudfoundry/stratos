[BugFixes]
- When Cloud Foundry rejects a request as invalid (for example a list
  with an unsupported sort order), Stratos now returns Cloud Foundry's
  own 4xx status. The page that made the request reports the error, and
  the "Cloud Foundry endpoint ... Request failed." banner no longer
  appears for an endpoint that is working.
- When adding a user to a Cloud Foundry endpoint fails, for example
  because the signed-in user is not a Cloud Foundry admin, only the Add
  Users dialog's failure message appears. The endpoint "Request failed."
  banner no longer appears with it. A failed user lookup is no longer
  reported as "user not found".
