[BugFixes: Endpoints]
- Endpoint addresses written differently are now treated as the same
  address: host case, a default port (`:443`, `:80`), a repeated or
  trailing `/`, and a query or fragment no longer make them differ.
  Before, the login hook did not connect the Cloud Foundry endpoint
  when `CF_API_URL` was written differently from its registered
  address, and connect, the shared-URL banner, the kubeconfig import
  and Git registration missed those duplicates. Stored and displayed
  addresses are unchanged.
- Registering a Cloud Foundry endpoint at an address that is already
  registered now shows the "already registered" warning. It was never
  displayed.
