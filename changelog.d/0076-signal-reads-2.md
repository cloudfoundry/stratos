[Maintainability]
- The loading overlay, the card status bar and the card progress overlay
  take a plain value as well as an Observable. Seventeen pages and cards
  that held a signal and wrapped it in `toObservable` only to feed one of
  those inputs now pass the signal's value directly: the two setup
  wizards, the metric card, the org, space, quota, git tab and
  application delete pages, the app usage, instances and status cards,
  the service plan step, the Kubernetes dashboard and its configuration
  card, the Kubernetes summary and the Helm release summary. Pages
  should look and behave as before.
