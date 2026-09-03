[BugFixes]
- The Helm release status poller asked the Kubernetes API for the wrong
  URL for several kinds in a release, got 404 every ten seconds, and dropped
  those resources from the release, so their preview panel opened empty and
  their status never updated. Cluster-scoped kinds such as ClusterRole,
  ClusterRoleBinding and IngressClass were fetched under the release
  namespace; the plural was guessed by appending an "s", which turns
  IngressClass into "ingressclasss"; and a "/status" subresource was
  appended to every non-core kind, which custom resources such as a Traefik
  IngressRoute do not have. The poller now takes each kind's plural and scope
  from API discovery, through the same REST mapper Helm itself uses, and
  fetches the resource itself, which carries its status. When discovery
  cannot name a kind the fallback guess no longer appends "/status" and
  pluralises "s", "x", "ch" and "sh" endings with "es".
