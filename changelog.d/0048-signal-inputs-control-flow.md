[Maintainability]
- 47 more component inputs moved from the `@Input()` decorator to Angular's
  signal-based `input()`: the ones a template reads inside an `@if`. Pages
  should look and behave as before. 148 inputs remain on the decorator.
