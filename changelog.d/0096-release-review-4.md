[BugFixes: Endpoints]
- Registering an autoscaler at an address on no registered Cloud
  Foundry's domain now names the address and lists the registered
  Cloud Foundry domains. Before, it named a cut-down domain such as
  "com".
- When the service broker list for an autoscaler is empty, the
  register form says why: the Cloud Foundry is not connected, or only
  a Cloud Foundry admin can list brokers.
- Unregistering a Cloud Foundry names the autoscalers registered for
  it, which are unregistered with it.

[BugFixes: Applications]
- Name sort keeps the numbers in a name apart, so app-1-11 sorts
  before app-2-1. Before, the numbers ran together (111 and 21).
