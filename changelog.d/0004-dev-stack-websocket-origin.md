[BugFixes]
- `make dev backend` now allow-lists the `ng serve` origin, so WebSocket
  features work in the development stack. jetstream rejects cross-origin
  upgrades unless the origin is in `ALLOWED_ORIGINS`, and the dev target set
  none — which broke `cf push`, application log streams and SSH with
  `request Origin ... is not authorized for Host ...`. A packaged console
  serves the UI from jetstream itself, so only development was affected.
