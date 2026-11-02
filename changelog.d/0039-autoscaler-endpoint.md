[Features: Autoscaler]
- The Cloud Foundry Autoscaler tile in Register Endpoint registers an
  autoscaler. The Register step asks which Cloud Foundry it serves and
  which of that Cloud Foundry's service brokers it is; both are picked
  for the usual names. With no Cloud Foundry registered on the
  address's domain, the step says to register it first. Registration
  is refused, with the reason on the form, when:
  - the address is not on that Cloud Foundry's domain, as the
    autoscaler CLI requires
  - the address does not answer `GET /health`, so is not an autoscaler
- An app's Autoscale calls go to the registered autoscaler whose
  service broker the app is bound to, with the user's Cloud Foundry
  token, which is never sent outside that Cloud Foundry's domain. Apps
  with no registered autoscaler keep the address guessed from the Cloud
  Foundry's (`api.` replaced by `autoscaler.`).
- The Autoscale tab names the autoscaler it uses, or shows the guessed
  address with a link to register it. It warns when that autoscaler is
  registered more than once, and when the app is bound to more than
  one registered autoscaler.
- The Endpoints page banner counts autoscalers linked to the same
  service broker as duplicates, whatever their addresses.
- Autoscaler endpoints cannot be connected: they use the user's Cloud
  Foundry connection.
