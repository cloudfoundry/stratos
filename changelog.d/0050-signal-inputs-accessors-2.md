[Maintainability]
- 22 more component inputs moved from the `@Input()` decorator to Angular's
  signal-based `input()`: inputs written as a setter that worked out what to
  show or passed the value on to a service, among them the page header's
  tabs, breadcrumbs and favorite. Pages should look and behave as before.
  105 inputs remain on the decorator.
