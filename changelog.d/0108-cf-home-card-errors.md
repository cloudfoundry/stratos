[BugFixes]
- A Cloud Foundry home card whose application, organization or route
  count failed to load (for example an unreachable endpoint, or one whose
  token can no longer be refreshed) shows "-" and the reason instead of
  0, as the Kubernetes home card does.
