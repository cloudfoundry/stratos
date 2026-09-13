[BugFixes]
- `AUTO_REG_CF_URL` had no way to supply a CA certificate, so on a foundation
  using a private authority the auto-registered endpoint reported itself
  connected and then failed every read with
  `x509: certificate signed by unknown authority`, while the same endpoint
  registered by hand with its CA worked. `SKIP_SSL_VALIDATION` was not a
  substitute: the CF API client will not honour it.
  `AUTO_REG_CF_CA_CERT` now takes the PEM inline and `AUTO_REG_CF_CA_CERT_PATH`
  reads it from a file, mirroring `CONSOLE_PROXY_CERT` and
  `CONSOLE_PROXY_CERT_PATH`. The path form is what a Kubernetes deployment
  wants, where the CA is a mounted secret; it wins over the inline value, and a
  path that cannot be read fails the registration rather than silently creating
  a CA-less endpoint.
