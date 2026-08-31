[BugFixes]
- The development TLS certificate now names `localhost`, `127.0.0.1` and `::1`
  in its `subjectAltName`, so `https://localhost:5440` can be trusted instead of
  only clicked through. The certificate shipped in `dev-ssl/` was a self-signed
  sample generated in 2017 with no extensions at all, and the setup guide told
  contributors to generate a replacement with `-subj '/CN=localhost'` — also
  without a SAN. Browsers have required `subjectAltName` since Chrome 58 and
  ignore a bare `CN`, so both were rejected with `ERR_CERT_COMMON_NAME_INVALID`
  no matter how they were trusted.

[Maintainability]
- `make dev cert` generates the development TLS key pair, and `make dev
  frontend` / `make dev backend` generate it when it is missing. `dev-ssl/` is
  no longer committed: the pair is per developer, and a private key in a public
  repository is a private key everyone has. The deployment guide's self-signed
  example gained a `subjectAltName` for the same reason as the dev one.
