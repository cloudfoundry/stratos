[BugFixes: Kubernetes]
- Choosing a file in Import Kubeconfig closes only its own earlier
  "Failed to load Kube Config" message, not every message on screen.

[BugFixes: Helm]
- Leaving a Helm workload page closes only its own "Errors were found
  when parsing this workload" warning, and deleting a workload closes
  only an earlier "Failed to delete release". Both closed every
  message on screen, including other pages' messages.
