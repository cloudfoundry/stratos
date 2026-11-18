[BugFixes: Accessibility]
- After a command is copied from the CF CLI menu, or a token from the
  UAA tokens menu, focus goes back to the menu button instead of the
  top of the page.
- With the Instances section of an application's summary open, the
  page no longer draws itself again every few seconds, which closed
  the section and sent focus to the top of the page.

[Features: Performance]
- An application's instance stats poll (every 5 seconds while the
  Instances section is open) now asks only for the stats, instead of
  fetching all of the application's data again.
