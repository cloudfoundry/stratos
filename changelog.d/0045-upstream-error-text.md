[BugFixes]
- Errors while backing up or restoring endpoints, connecting, registering or
  updating an endpoint, reading service key credentials and loading metrics
  now read the same way as other upstream errors. An HTML error page from a
  proxy or router shows its heading and message instead of its markup. A
  Cloud Foundry error shows its reason instead of `undefined (422)`, and a
  response with no body shows `HTTP 502 Bad Gateway` instead of `null (502)`.
- A failed backup or restore that got no response from the server now says
  so. The reason was being dropped.
- Registering an endpoint no longer says `undefined` when a 403 has no
  Stratos error in its body, such as a page from a proxy.
