[BugFixes: Services]
- Rebinding a route service: when removing the old binding succeeded
  and the new bind failed, the page kept showing the old binding, and
  the next attempt failed on the binding that was already gone. The
  page now shows the route as unbound.
- Binding to a service instance that is still provisioning no longer
  says "bound to the application" before the bind has happened. It
  says the instance will be bound automatically when it is ready.
- When a user-provided service instance was created but binding it to
  the application failed, the message did not say the instance had
  been created. It now does.

[BugFixes: Users and Roles]
- A role change made while the users list was still loading is no
  longer overwritten by that older load. Before, lists showed the
  previous roles until the page was reloaded.

[BugFixes: Endpoints]
- An endpoint update through the API that left out `ca_cert` removed
  the endpoint's stored CA certificate. Leaving the field out now keeps
  the certificate; an empty `ca_cert` still clears it.
