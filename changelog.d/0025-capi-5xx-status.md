[BugFixes]
- When a Cloud Foundry endpoint keeps answering with a server error
  (5xx), the endpoint banner now says the endpoint is unreachable or
  down and shows Cloud Foundry's status code, for example "HTTP 503: The
  endpoint is unreachable or down.". It used to read "Request failed."
  with no code.
