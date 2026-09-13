[BugFixes]
- An endpoint registered with a CA certificate is now reached using it. The CA
  was stored on the endpoint but never passed to the CF API client or to the
  OAuth and OIDC token calls, so against a foundation using a private CA —
  a lab, or Cloud Foundry on Kubernetes — connecting failed and every read
  returned `x509: certificate signed by unknown authority`. The console
  reported this as the endpoint being unreachable, which pointed at the network
  rather than at certificate trust.
