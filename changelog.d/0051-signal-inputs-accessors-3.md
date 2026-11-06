[Maintainability]
- 13 more component inputs moved from the `@Input()` decorator to Angular's
  signal-based `input()`: inputs written as a setter that emitted an event,
  filled in a form or started something when set (the connect form, the log
  viewer, parameter forms). Pages should look and behave as before.
  92 inputs remain on the decorator.
