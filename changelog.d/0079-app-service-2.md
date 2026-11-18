[Maintainability]
- The application pages and cards read the application detail data
  service's signals directly: the CLI info, SSH, edit and autoscaler
  pages, the build, git, services and routes tabs and the instances
  card. The ApplicationService Observable facade and the unread
  ApplicationMonitorService are removed. Pages should look and behave
  as before.
