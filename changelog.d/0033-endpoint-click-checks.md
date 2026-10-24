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

[BugFixes: Endpoints]
- In Register Endpoint, the Connect step shows the credentials and
  endpoint options only while "Connect to <name> now" is ticked, starts
  unticked for each registration, and keeps Previous and Connect in view
  when the step is taller than the dialog.
- "Successfully registered '<name>'" stays on screen; the endpoints page
  cleared it as soon as the endpoint list updated.
- The note that an address is already registered names only endpoints
  of the same type, so a Metrics endpoint beside the Cloud Foundry it
  watches is not called a duplicate.
