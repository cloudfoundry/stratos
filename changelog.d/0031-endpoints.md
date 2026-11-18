[Features: Endpoints]
- An endpoint whose last connect failed says so after a reload: its
  card shows "The last error was <reason>. Reconnect to get the latest
  status." and the endpoints list shows the same on hover. The reason is
  kept in the browser, per user and endpoint, until a connect succeeds
  or the endpoint is unregistered.

[BugFixes: Endpoints]
- A failed endpoint connect says why. A rejected password or token
  keeps its 401 or 403 and says the credentials were rejected; an
  endpoint that does not answer, answers 5xx or fails TLS reports 502
  and what failed; the endpoint's own message is shown (a Kubernetes
  Status, a GitHub or GitLab error). They all read "Could not connect to
  the endpoint" before.
- The endpoint admin role is granted only by the `stratos.endpointadmin`
  scope itself. Any scope containing that text, such as
  `stratos.endpointadmin_read`, let a user register, edit and
  unregister endpoints.
- Edit, Unregister and Connect are offered only to users the backend
  allows to use them, and the Edit page sends other users back to the
  endpoints list. Every user saw all three on every endpoint.
- Edit Endpoint shows the stored CA certificate. It showed none, and
  saving the form removed the certificate.
- The Register Endpoint dialog closes without reloading the page under
  it (which left the page unable to scroll), and shows one Cancel and
  one "registered" message.
- Pressing Enter in the Connect dialog connects, once.
- A request to an endpoint that does not answer in time reports 504
  "Request timed out" for that endpoint instead of leaving it out of the
  answer, or a 500 on a passthrough.
- Requests to an endpoint with a CA certificate reuse their
  connections, and write and read requests get the right timeouts (they
  were swapped).

[BugFixes]
- Cancel in a stepper (Deploy Application, Manage Users) runs the
  step's clean-up: the upload step's deployer closes, and the error
  message goes.

[BugFixes: Git]
- GitHub and GitLab endpoints check the token when connecting. Any token,
  even a wrong one, used to connect and read Connected.
- A GitHub endpoint whose user could not be read shows no avatar,
  instead of a broken picture.

[BugFixes: Kubernetes]
- Kubernetes clusters registered with client certificates trust the
  endpoint's CA certificate; they failed with "certificate signed by
  unknown authority" unless Skip SSL validation was set. A cluster that
  refuses the certificate reports 401 instead of a proxy failure.
- Import Kubeconfig registers each cluster with its
  `certificate-authority-data` as the CA certificate. A kubeconfig that
  pinned its CA had to skip validation or fail.

[BugFixes: Helm]
- A Helm repository's Synchronize action is back in its endpoint menu,
  and the endpoints list shows a Helm repository's sync status instead
  of "Disconnected".

[BugFixes: Metrics]
- The metrics routes for application and cell pages accept only the
  queries those pages send. Through the metrics endpoint's stored
  credentials, any signed-in user could add any PromQL to a cell query,
  and a user who could see one application could read the metrics of
  every application.
- A metrics endpoint can be registered with "Connect (Optional)" again,
  its card shows "N / M sources" again, and its page
  (`/endpoints/metrics/<id>`) opens again instead of failing.
- Registering a metrics endpoint that answers 404 or 500 fails instead
  of succeeding, and connecting one that cannot be reached reports it
  instead of failing the request.

[BugFixes: Autoscaler]
- The autoscaler's 401 for a user who is not a space developer of the
  app reaches the user as a 401 with its message, instead of a 500.
