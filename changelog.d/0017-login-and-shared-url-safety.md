[BugFixes]
- Fixed a login redirect loop, and app deletion no longer leaves orphaned routes and bindings behind (#5697). The SSO message banner strips URL lures before rendering (#5681), SSO `nosplash` is honored for unauthenticated visitors (#5678), and the login background is sized correctly (#5582).
- When more than one registered endpoint shares a URL, a banner now says so — on CF, Kubernetes and Helm endpoints and in both pickers (#5534, #5698, #5699).
