[BugFixes]
- Pop-up messages at the bottom of the page no longer pile up in the
  same spot. A second message covered the first, which peeked out
  behind it and could catch a click meant for the new message's close
  button. As before the move away from Angular Material, one message
  is shown at a time: a new message replaces the one on screen. A
  closed message is also cleared from what screen readers can find.
