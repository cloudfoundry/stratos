[BugFixes]
- Fixed an app-wide denial of Stratos-level permissions caused by the permission checker contract (#5574), so administrative affordances appear for the users entitled to them.
- CF errors are classified correctly and transient list failures retry instead of surfacing as a hard error (#5580), and the user profile is fetched on first subscription (#5575).
