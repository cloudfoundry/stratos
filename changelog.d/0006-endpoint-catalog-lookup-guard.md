[BugFixes]
- Screens that look up an endpoint's type no longer throw when that type has no
  registered entity — which happens to an endpoint left behind by a removed or
  disabled extension, or registered by an older version. `entityCatalog
  .getEndpoint()` returns nothing for an unknown type, but its signature
  promised a result, so callers dereferenced it unguarded and the failure
  surfaced as an uncaught `TypeError` that tore down the surrounding
  component. The affected paths were endpoint edit, connect, create,
  backup/restore, the home page, the metrics list, git registration and the
  Kubernetes summary tab. The signature is now honest about returning nothing
  and every caller handles it.
