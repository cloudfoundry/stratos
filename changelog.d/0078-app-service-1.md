[Maintainability]
- The application pages read the app, org, space, endpoint and loading
  state as signals from the detail data service instead of through the
  ApplicationService Observable facade: the action bar, the page header
  and its breadcrumbs, the edit and autoscaler policy titles and the
  build tab's endpoint name. They should look and behave as before.
