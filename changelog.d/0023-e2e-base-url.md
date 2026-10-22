[BugFixes]
- An e2e run on other ports (`FRONTEND_PORT`, `BACKEND_PORT`) started
  its own servers there, but its logins and API calls still went to
  `https://localhost:5540`, so it logged into whatever console served
  5540, such as another e2e run or a dev server. Every fixture now
  takes the console URL from the same place as the Playwright config.
