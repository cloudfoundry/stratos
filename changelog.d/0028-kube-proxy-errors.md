[BugFixes]
- A Kubernetes list whose cluster could not be reached, or whose token
  had expired or was refused, showed its "There are no …" message as
  if the cluster were empty. The Nodes, Namespaces, node Pods and
  resource lists now show "Failed to load" with the cluster's reason
  (for example `401 Unauthorized`, or the connection error) and a
  Retry button. Deleting a resource or creating a namespace that the
  cluster refuses now reports the failure instead of appearing to
  succeed.
