[BugFixes]
- The deploy wizard no longer reports "Repository not found" while a self-hosted GitLab or GitHub Enterprise base URL is still being typed — the repository check now waits until the entered URL is well-formed instead of querying a half-typed host.
- Repository suggestions in the deploy wizard now handle project names containing `&`, `#` or spaces, which previously truncated the search and returned no matches.
