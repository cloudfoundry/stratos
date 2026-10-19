[BugFixes]
- Fixed pages that waited forever:
  - The UAA setup wizard checks the credentials in step 1 and shows an
    error instead of an endless "Saving configuration" overlay. The local
    account wizard gets the same overlay fix.
  - Kubernetes config import no longer stalls at the first Connect, and
    moves on past a cluster that fails to register or connect.
  - The role picker in Add User and Manage Roles no longer shows
    "Loading organizations..." forever; a failure shows Retry.
  - The navigation progress bar no longer stays at 95% after a page
    fails to load.
  - After a failed session check near expiry, navigation no longer stops
    working until a reload.
- Fixed views that did not show or showed out-of-date content:
  - SSH sessions show their progress and server errors.
  - Deploy keeps its completion notice after you leave the page and keeps
    every log line. A second deploy from the same wizard is labelled
    "Deploy again".
  - The application Autoscale tab is back. It shows the reason when the
    autoscaler refuses a request, and Create Policy only when there is no
    policy. Its scaling history and metric charts load again; every
    request for them had failed with an HTTP 400 error.
  - The git tab no longer stays on "Retrieving Git Details" after a
    failed lookup.
  - Service broker cards show the Space row, and the broker URL as the
    link text.
  - Home page application cards follow start, stop and delete.
  - Helm release pages no longer show earlier data after a failed reload,
    and the Helm catalog sidebar shows.
  - The Kubernetes resource viewer shows its header, and Delete works.
  - Metrics charts with a time range selector render.
  - An active user is no longer warned and logged out as idle after a
    short session check failure.
- Stopped background work that kept running after you left a page:
  - the application stats poll (one request per Cloud Foundry every 30
    seconds, until a reload);
  - the metrics polls;
  - watches on endpoints, permissions and quotas.
- Disconnecting a Kubernetes endpoint clears its cached data and errors.
- Removed the `users/remove` page, which nothing linked to any more. The
  users tabs remove users directly.
