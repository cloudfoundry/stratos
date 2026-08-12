[BugFixes]
- Release notes no longer open with an unformatted duplicate of the
  release name. The publish step consumed the whole annotated tag
  message, whose first line is the tag's own display name; it now
  extracts only the tag body, so the notes start at the first section
  the way the release title already says the rest.
