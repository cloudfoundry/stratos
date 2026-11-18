[Maintainability]
- The last 80 inputs moved from the `@Input()` decorator to Angular's
  signal-based `input()` and `model()`: the list cell base class and its
  cells and cards, the select, checkbox, toggle and date controls, the
  endpoint auth forms, the wizard step's remaining inputs, the sort and
  name-check directives and a number of single components. No `@Input()`
  decorator remains in the frontend source. Pages should look and behave
  as before.
- Extension authors: an endpoint auth form's `formGroup` (and `config`,
  where it has one) is now a signal input, declared with `input()` and
  read as `formGroup()`. The `IAuthForm` type reflects this.
