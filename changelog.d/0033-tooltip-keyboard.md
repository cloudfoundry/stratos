[BugFixes: Accessibility]
- Tooltips show for keyboard users: tabbing to a control with a tooltip
  shows it after the usual delay, and moving focus away hides it.
  Screen readers read the tooltip as the control's description.
- A tooltip can be dismissed with Escape without moving focus or the
  pointer, and the pointer can move onto a tooltip to read it without
  it closing. In a dialog, the first Escape closes the tooltip and the
  next one closes the dialog.
- Tooltips on text, icons and other elements that cannot take keyboard
  focus are still shown on hover only.
- The Remove control beside each user name in Add User, Invite Users
  and Manage Users is now a button, so keyboard and screen reader users
  can reach and use it.
