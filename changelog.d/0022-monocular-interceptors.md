[BugFixes]
- Helm chart catalog and chart values requests go through the app's
  standard request handling again. Since the Angular upgrade they had
  used a separate client that skipped it, so their responses did not
  refresh the app's XSRF token and they were missing from the API call
  counts and timings.
