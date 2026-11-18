[BugFixes: Accessibility]
- Checkboxes and slide toggles placed without an id or name no longer
  render `id="undefined"` and `name="undefined"`. Several on one form
  (adding routes, quota definitions) shared that id, and assistive
  technology relies on ids being unique to tie a control to its label
  and error text.
