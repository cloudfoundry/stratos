[BugFixes]
- Opening an editor after a JSON editor had been shown no longer logs
  "DropIntoEditorController depends on UNKNOWN service
  treeViewsDndService" in the browser console. The editor's
  drop-into-editor feature, which failed to start, now loads with every
  editor.
