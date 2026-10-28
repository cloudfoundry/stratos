[Features]
- Steppers no longer show a greyed-out Previous button on their first
  step. Completed step headers can be clicked to go back to that step.

[Features: Endpoints]
- Connect and Reconnect open the same two-step Register and Connect
  dialog as Register Endpoint, on the Connect step with Register marked
  done. This covers the endpoint card and row menus, the home page, the
  Reconnect prompt and the Cloud Foundry login prompt. Previous, the
  Register step's header or the "Review" link show the registration.
  Going back never unregisters the endpoint.
- The Register step ends with "Unregister…" for users who can change
  the endpoint, and asks before removing it. In Register Endpoint the
  form then reopens with its values, so a mistake can be fixed and the
  endpoint registered again.
- The Register step and Edit Endpoint show each CA certificate decoded:
  - subject and issuer
  - validity dates
  - SHA-256 fingerprint
  - a badge when it has expired or expires within 30 days
- "Check trust now" tests the endpoint address and its login server
  (UAA) against the certificate on the form, and says for each host
  whether it is trusted or why not.
- Skip SSL validation and the CA certificate are set only on the
  Register step and in Edit Endpoint. The Connect step's credentials
  form no longer offers them.

[Features: API Keys]
- An API key is created in two steps:
  - a description and an expiry: 30, 90 or 365 days, a date, or Never
    (90 days by default)
  - the secret, hidden until shown, with a copy button. Escape does
    not close this step. Done closes the dialog, and the secret is not
    shown again.
- API keys can expire. Keys created before this release never expire.
  A request that uses an expired key is refused with 401 and "API key
  expired on <date>".
- The API Keys page has an Expires column. A banner names a key from a
  day before it expires until a week after, with "Create replacement".
  Last Used notes attempts that were refused.
