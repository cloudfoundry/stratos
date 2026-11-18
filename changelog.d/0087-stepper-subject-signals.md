[Maintainability]
- Wizard steps submit with Promises: a step's next action is an async
  function, and the stepper awaits it. The unused Observable `onNext`
  input on steps and the `StepOnNextFunction` type are gone.
- Component state that was held in RxJS subjects or refreshed with
  `markForCheck` is held in signals, across the stepper, the deploy and
  add service instance wizards, the autoscaler policy editor, the login
  page, the log and analysis report views and the custom form
  controls. Subjects that nothing read are removed, as are the unused
  global event configuration channel, `SteppersService` and the Helm
  `MenuService`.
