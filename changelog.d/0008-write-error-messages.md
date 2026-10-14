[BugFixes]
- A failed write now reports the same message whether Cloud Foundry
  answered at once or after a background job: Stratos's lead-in followed
  by the service broker's or Cloud Foundry's own explanation, with any
  HTML page it quoted reduced to its text. The Cloud Foundry error code
  and title are logged to the browser console.
- Failures that showed no reason now show the one the server gave:

  | Where | Showed |
  |---|---|
  | Creating or editing an organization, quota or space quota | `[object Object]` |
  | Deleting a service instance from a list, unbinding from its summary page | `[object Object]` |
  | Binding a route service, creating or deleting a service key | `undefined (502)` |
  | Attaching a newly created route to an application | `Http failure response for …` |
  | Detaching a service instance's bindings | `unknown error` |
  | Rolling back an application | the error title only, or `Rollback failed` |
  | Any wizard step whose submit failed with an HTTP error | `[object Object]` |
  | A detail page's error banner and header actions, adding an API key | `[object Object]` |
  | Failed loads of an organization, space, endpoint, application or CF info | `[object Object]` |
