[BugFixes]
- Tab still indents in the code editors, and each editor now names the
  key that makes Tab move focus out of it, Ctrl+Shift+M on every
  platform. Each editor also has a name for screen readers.
- The SSH terminal keeps Tab for the shell; Ctrl+Shift+M makes Tab move
  focus instead, as shown under the terminal. After the session ends,
  Tab leaves the terminal and "Disconnected" is announced.
- Leaving an application's SSH session with `exit` no longer shows
  "Error connecting to web socket".
