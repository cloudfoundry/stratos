[BugFixes: Accessibility]
- A link to the page already shown keeps focus on it: the Status and
  Uptime cards on an application's summary, and the breadcrumb and
  Summary tab on a space's summary. The page was built again, and
  focus went to the top of the page. Pressing the current tab or menu
  item no longer redraws the page; use Refresh to load new data.
- The theme toggle says "Dark mode activated" or "Light mode activated"
  only when the theme is changed, not on every page change.
