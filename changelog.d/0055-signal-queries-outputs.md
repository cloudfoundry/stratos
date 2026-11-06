[Maintainability]
- The view and content queries (`@ViewChild`, `@ViewChildren`,
  `@ContentChild`, `@ContentChildren`) and the last three `@Output()`
  decorators moved to Angular's signal-based `viewChild()`,
  `contentChild()` and `output()`. With the inputs done earlier, no input,
  output or query decorator remains in the frontend source. Pages should
  look and behave as before.
