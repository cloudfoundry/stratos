[BugFixes]
- The application delete confirmation now names the org and space when the
  wizard is opened by URL or after a refresh. It resolved all four names
  together, so a page load where the app and endpoint had arrived but the org
  and space had not showed `org "?" / space "?"` — losing the disambiguation
  the dialog exists to provide. Each name is now resolved on its own.
