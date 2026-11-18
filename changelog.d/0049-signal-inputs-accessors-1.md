[Maintainability]
- 21 more component inputs moved from the `@Input()` decorator to Angular's
  signal-based `input()`: inputs written as a setter that only stored the
  value or worked out what to show from it. Pages should look and behave as
  before. 127 inputs remain on the decorator.
