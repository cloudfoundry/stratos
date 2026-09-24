[BugFixes]
- Escape now closes the row-actions menu in lists and the options list
  of the console's dropdown selects, and returns focus to the button
  that opened them. Both announced themselves as popups to assistive
  technology but ignored Escape, so a keyboard user could not close
  them. Inside a dialog, one Escape closes only the menu or list, not
  the dialog behind it.
