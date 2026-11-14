[BugFixes: Accessibility]
- Refresh, the list pager, Clear in a list's filter popup, Clear filters
  and sort, the bulk actions, and the instance count buttons keep focus
  while they are off. They turned themselves off when pressed and sent
  focus to the top of the page.
- Closing a list's filter popup with Close or Escape puts focus back on
  the button that opened it.
- Clear in a list's bulk-action bar puts focus on the first selection
  checkbox.
- Cancel and Save in the instance count editor put focus back on Edit
  instance count.
- Dismiss on an endpoint error message puts focus on the main content.
