[Chores]
- Removed the unused background-grid/background-image CSS that the
  Docusaurus template carried in; one rule used Sass-style `&--`
  nesting that plain CSS can't parse, tripping an optimizer warning
  on every website build.
