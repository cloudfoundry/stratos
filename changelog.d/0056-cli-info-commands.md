[BugFixes]
- The CLI Info pages give commands that work when pasted. Scaling an
  application's memory is now `cf scale "app" -m [N]M`; it was shown as
  `-i -m [N]`, where `-i` needs a value of its own. Organization and space
  names are quoted in every command, so a name with a space in it no longer
  breaks the command.
- The Getting Started steps on the CLI Info pages follow the endpoint:
  `cf api` carries `--skip-ssl-validation` when the endpoint is registered
  with certificate validation skipped, and `cf login --sso` is offered when
  the endpoint allows single sign-on. The sample login output shows the
  `Email:` and `Password:` prompts of the current CLI, and its lines are no
  longer indented.
- A CLI Info page opened by its address, or reloaded, fills in the
  organization and space names. It used to show `[organization name]` and
  `[space name]` in their place.
- The CLI Info page of a Cloud Foundry or an organization no longer requests
  an organization or a space named `null`.
- The application's CLI Info page has a close button again. On the Cloud
  Foundry, organization and space pages the close button is labelled "Back"
  instead of "Back to App", and on a page opened by its address it returns
  to the organization or space instead of "Page not found".
