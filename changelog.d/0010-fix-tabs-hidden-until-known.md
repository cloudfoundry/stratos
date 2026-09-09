[BugFixes]
- A tab the user may not see, such as Variables on an application for
  anyone who is not a space developer, was drawn on page load and then
  removed once the permission check answered. Tabs gated on a permission
  or endpoint capability now stay out of the side nav until the answer is
  known (#5894).
