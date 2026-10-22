[BugFixes]
- The Metrics tab never appeared on an application, a Cloud Foundry or
  a Kubernetes node, even with a metrics endpoint registered and
  connected. The check read a flag that nothing has set since May 2026;
  it now reads the endpoint's metrics link from the backend.
- When the Metrics tab opened, its charts asked for the time window
  before the window was set, so Prometheus rejected the first request
  and the charts said "No results found" until the next refresh ten
  seconds later. The first request now carries the window.
