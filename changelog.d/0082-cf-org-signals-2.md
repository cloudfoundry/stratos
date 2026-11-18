[Maintainability]
- The Cloud Foundry organization service exposes its spaces, apps, app
  instance count, memory total, loading flag, user count, the current
  user's role and the quota link as signals. The organization summary
  page and its summary card read them directly, and the page now
  subscribes to the route, private domain, user-provided service and
  quota requests itself. Pages should look and behave as before.
