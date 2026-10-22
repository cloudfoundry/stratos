[BugFixes]
- An e2e run on other ports started its own servers there, but its
  logins and API calls still went to `https://localhost:5540`, so it
  logged into whatever console served 5540, such as another e2e run
  or a dev server. Every fixture now takes the console URL from the
  same place as the Playwright config. The e2e ports are now set with
  `E2E_FRONTEND_PORT` and `E2E_BACKEND_PORT`, apart from the dev
  servers' `FRONTEND_PORT` and `BACKEND_PORT`; an e2e run still reads
  those old names for one release.
