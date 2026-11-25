[BugFixes]
- An older response that arrives after a newer one no longer replaces
  it: the autoscaler metric chart keeps the time window picked last,
  scaling history the page picked last, and a saved autoscaler policy
  stays shown. A deleted Kubernetes resource, a created or removed API
  key, and a connect or disconnect on the Endpoints page are no longer
  undone by a list fetched before the change, and a reloaded Helm
  release shows its newest detail and history.
- The Cloud Foundry cell summary page sends one request for the cell's
  details instead of six.
