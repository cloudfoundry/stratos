[BugFixes]
- Fixed the documentation site serving a stale search index. The search
  plugin derives the index's cache-busting hash by scanning `docsDir` and
  `blogDir`, which were left at their defaults and pointed at directories
  this site does not have. With no files to scan the hash came back empty
  and the index was fetched from an unversioned URL, so a returning
  visitor kept whatever their browser had cached from an earlier build.
