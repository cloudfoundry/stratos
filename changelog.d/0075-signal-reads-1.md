[Maintainability]
- Seven components that wrapped a signal in `toObservable` only to read it
  back with the async pipe now read the signal in the template: the logout
  page's error view, the page header's mobile menu toggle, the three
  profile settings toggles, the Kubernetes analysis report breadcrumbs,
  the Helm release analysis report, the kubeconfig certificate cell and
  the service instance wizard title. Each now renders in the same
  change-detection pass instead of one microtask later. Pages should look
  and behave as before.
