[BugFixes]
- The Cloud Foundry summary card shows the foundation's description
  and CF API version again; since 5.0.0 it showed "-" and an empty
  version.

[Maintainability]
- The Cloud Foundry endpoint service exposes its apps, loading flag,
  counts, memory total, CF info and SSH access as signals. The Cloud
  Foundry summary tab, its info card and the Users tab read them
  directly. Pages should look and behave as before.
