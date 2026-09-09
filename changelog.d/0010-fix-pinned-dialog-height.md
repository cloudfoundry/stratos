[BugFixes]
- A dialog with a drag handle, such as Add User, could grow past the
  bottom of the window once its content loaded, leaving its buttons
  unreachable. The panel is now capped at the window edge from where it
  sits, and scrolls inside instead.
