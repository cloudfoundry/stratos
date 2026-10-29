[BugFixes]
- Checkboxes, slide toggles and button toggles show the value and the
  enabled or disabled state a form gives them. They could keep their old
  look until clicked: a checkbox stayed greyed after its form was
  enabled, and on the profile page picking Dark left Light highlighted
  too.
- A form field whose label comes from the page after it is shown, such
  as the Connect dialog's username and password, shows that label; the
  fields were blank lines.
- Card titles wrap between words, not mid-word, and a second line is no
  longer cut off. Hovering a card's title shows its full name.
- Debug logs no longer show endpoints' client secrets; the metrics
  plugin printed every endpoint with its secret on each page load.

[BugFixes: Endpoints]
- In Register Endpoint, the Connect step shows the credentials and
  endpoint options only while "Connect to <name> now" is ticked, starts
  unticked for each registration, and keeps Previous and Connect in view
  when the step is taller than the dialog.
- "Successfully registered '<name>'" stays on screen for 7 seconds; the
  endpoints page cleared it as soon as the endpoint list updated, and it
  was gone before it could be read.
- When two endpoints of one type share a URL, the endpoints page says so
  above Total Endpoints, as the Cloud Foundry pages do, in place of a
  message after registering that had to be dismissed. A Metrics endpoint
  beside the Cloud Foundry it watches is not counted.
- Logging in no longer reports "Couldn't check credentials" when the
  login worked but connecting the auto-registered Cloud Foundry endpoint
  failed. The login completes and the failure is logged.
- With an endpoint of another type, such as Metrics, registered at the
  auto-registered Cloud Foundry API's URL, logging in connects the
  Cloud Foundry endpoint rather than trying the other one with Cloud
  Foundry credentials.
- With user endpoints enabled, a Metrics endpoint at a Cloud Foundry
  API's URL no longer hides that Cloud Foundry endpoint. A user's own
  endpoint now hides only a system endpoint of the same type at the
  same URL.
- With user endpoints enabled, connecting to an endpoint no longer
  disconnects the user's other connections at the same URL. When a
  personal endpoint is one of the pair, the connect's one message names
  the other connections of the same type and offers "Disconnect
  others"; dismissing it keeps them. Two system endpoints at one URL are
  not reported.
- After registering an endpoint, the endpoints list stays on screen
  while it refreshes instead of briefly showing "Loading endpoints".
- The Connect form labels the username and password fields of
  endpoint types that give no labels of their own, such as Metrics.
- The browser no longer fills the console login into an endpoint's
  Connect credentials, or into the Client ID and Client Secret under
  Advanced Options when registering or editing an endpoint, where it
  was saved and made every connect fail with "Bad credentials". The
  user-invite client, backup and restore passwords and setup wizards
  are marked the same way.
- Only Stratos admins are offered "Share this endpoint connection",
  which the server refuses for other users.
- A failed Reconnect keeps the Connect dialog open with its error,
  instead of closing as if it had connected.
- The Register dialog's connect step names what to enter for a
  single-token login, such as "Personal Access Token", and its help
  button no longer covers the title.
- Opening help from the Register dialog no longer hides the dialog's
  Connect and close buttons, and help that cannot be loaded says so.
- The Artifact Hub registration text no longer shows backticks around
  "Register".
- When a Cloud Foundry login server turns down the endpoint's client
  rather than the user, Connect says so: a Client ID or Client Secret
  it rejected, or a client that cannot log in with a username and
  password, for which it suggests "Allow SSO login" or Client ID "cf".
  Both read as a wrong password before.
- A Cloud Foundry endpoint registered or edited with the console's own
  Client ID and no Client Secret, as an endpoint's review shows the ID
  or a browser fills it in, connects like one registered with Client ID
  left empty. It was saved without the secret, and every connect failed
  with "Bad credentials".
- The Cloud Foundry endpoint docs say which client a blank Client ID
  uses (the console's `CF_CLIENT`, not always `cf`) and what a client
  needs for password and for SSO connects, and the SSO guide explains
  "Invalid redirect" when connecting an endpoint.

[BugFixes: Git]
- The GitHub and GitLab connect help opens again instead of showing an
  empty "Javascript is required" page, and the Git logo shows.

[BugFixes: Accessibility]
- The Register Endpoint and Connect dialogs are announced as dialogs,
  named by their titles. Opening Register Endpoint moves focus into it,
  Tab stays inside, and closing it returns focus to the button that
  opened it.
- Icon buttons are announced by name (Back, Close, Refresh, First page,
  Next page, Actions, Help on connecting, Backup/Restore Endpoints)
  instead of their icon text, and menu items and dialog titles no
  longer include icon names.
- Endpoint cards can be opened from the keyboard through their title.
- The github.com and GitHub Enterprise choices on the Register step are
  one radio group, so arrow keys move between them.
- Select lists announce their options with their selected and disabled
  states, and the control is linked to its list.
- The closed side panel can no longer be reached with Tab or announced
  as a button.
- Escape closes the Connect and Create an API Key dialogs, and answers
  "Yes" to "Are you still there?"; these dialogs ignored it.
- The favorite star on endpoint and other cards is announced as "Add
  to favorites" or "Remove from favorites", as in lists; it read the
  opposite of its state, followed by the icon name "star_border".
- Card action menus announce their entries as menu items; the menu
  was announced with none.
- Copy-to-clipboard buttons tell a screen reader "Copied to
  clipboard" or "Copy failed"; only the on-screen tick or icon did.

[BugFixes: Cloud Foundry]
- An event's detail dialog has room around its contents; it ran to
  the dialog's edges.
- An event's data keeps its lines whole, scrolling sideways when one
  is long, and wraps to show everything on hover or keyboard focus; it
  broke values such as IDs in the middle.

[BugFixes: Kubernetes]
- Kubernetes and Helm pages show their icons again, such as the Helm
  charts filter toggle, analysis report status and the kube terminal;
  they showed the icon's name ("filter_list", "warning") as text.
- The Helm charts page names its repository filter once, by the
  field's own label; a heading "Filter By Repository" sat over that
  label.
- A Helm chart or release without a logo shows the placeholder image
  instead of a broken image, and the Popeye and kube-score analysis
  descriptions open. All four pointed at /core/assets, where the build
  does not put the Kubernetes package's files, so the console page
  answered instead.

[BugFixes: API Keys]
- The docs explain API keys: who can create them (API_KEYS_ENABLED),
  the "Authentication: Bearer" header they are sent in and the routes
  that accept them.
- The "Create an API key" prompt on an empty API Keys page points at
  the toolbar button, below the page header, instead of overlapping "You
  have no API keys"; the same prompt on an empty Home page is placed the
  same way.
