[BugFixes]
- Pop-up messages at the bottom of the page no longer pile up in the
  same spot. A second message covered the first, which peeked out
  behind it and could catch a click meant for the new message's close
  button. Open messages now share one box: when there is more than
  one, numbered tabs along its top switch between them, and a new
  message is shown as it arrives. Closing a message removes only its
  tab, and the other tabs keep their numbers. A message that repeats
  one already open adds a count to its tab instead of a new tab. The
  tabs work with the arrow keys and screen readers, and a closed
  message is also cleared from what screen readers can find.
