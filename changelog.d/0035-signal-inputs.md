[Maintainability]
- Most component inputs and outputs moved from the `@Input()` and
  `@Output()` decorators to Angular's signal-based `input()` and
  `output()`:

| Kind     | Decorator before | Decorator after | Signal after |
|----------|------------------|-----------------|--------------|
| Inputs   | 602              | 195             | 454          |
| Outputs  | 62               | 4               | 60           |

- Pages should look and behave as before. The 195 inputs left on the
  decorator need design changes and follow in a later release.
