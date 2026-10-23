[BugFixes]
- A Kubernetes list whose cluster could not be reached, or whose token
  had expired or was refused, showed its "There are no …" message as
  if the cluster were empty. The Nodes, Namespaces, node Pods and
  resource lists now show "Failed to load" with the cluster's reason
  (for example `401 Unauthorized`, or the connection error) and a
  Retry button. Deleting a resource or creating a namespace that the
  cluster refuses now reports the failure instead of appearing to
  succeed.
- Picking a namespace on the Kubernetes Services list or a resource list
  (Config Maps, Secrets, Deployments, ...) now lists that namespace's
  resources; it showed "There are no ..." whatever the namespace held.
  Refresh and Retry reload the namespace on screen, Pods included.
- Kubernetes lists show their loading message until their own load ends,
  instead of a flash of "There are no ...", and show only the failure of
  the list on screen (a cluster-wide failure no longer marks a node's
  Pods page or a namespace view as failed).
- A Kubernetes Summary tab or home card whose node, namespace or pod list
  failed to load shows "-" and the reason instead of 0.
- List error banners name the endpoint ("prod-cf: failed to load")
  instead of showing its GUID, on Cloud Foundry and Kubernetes lists.
- A failing metrics endpoint now shows "Failed to load metrics: <reason>"
  on Kubernetes node and pod metrics and Cloud Foundry application
  metrics charts, and on a node's usage summary, instead of empty charts
  and 0 values.
- The Helm releases list shows which Kubernetes endpoints could not be
  listed and why; their releases used to go missing silently.
- Kubernetes list failures reach the page-header error banner and the
  endpoint's error page, as Cloud Foundry list failures do.
