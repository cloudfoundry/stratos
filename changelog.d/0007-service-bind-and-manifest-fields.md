[BugFixes]
- Creating a service instance with an application selected in the
  wizard now binds it to that application. The binding was silently
  skipped: the wizard looked for the new instance under a link name
  Cloud Foundry does not use (#6001).
- Deploying an application keeps every field of its manifest. Stratos
  adds a `STRATOS_PROJECT` environment variable before the push and,
  in doing so, rewrote the manifest with only the fields it knew,
  dropping the rest before `cf push` saw them (#6003). Among them:
  - `metadata` (labels and annotations)
  - `processes` and `sidecars`
  - `readiness-health-check-*` and `log-rate-limit-per-second`
  - the top-level `version`
