[Maintainability]
- The wizard step's 12 setter inputs (`hidden`, `valid`, `canClose`, `skip`,
  the button texts and others) moved from the `@Input()` decorator to
  Angular's signal-based `input()`. The stepper now follows a step's inputs
  directly, so the step's four change events are gone. Wizards should look
  and behave as before. 80 inputs remain on the decorator.
