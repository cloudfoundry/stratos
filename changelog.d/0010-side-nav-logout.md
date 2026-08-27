[Features]
- The Sign Out button in the side navigation can now be hidden with
  `HIDE_NAV_LOGOUT=true`, or `console.ui.hideNavLogout` on the Helm
  chart. It is presentation only — the user menu in the page header
  keeps its own Sign Out, so the ability to log out is unchanged.

[BugFixes]
- The side navigation no longer offers Sign Out when there is no session
  to end. Running with `AUTH_ENDPOINT_TYPE=none` grants the
  `stratos.noauth` scope, which the page header has always honoured; the
  side navigation ignored it and showed the button anyway.
