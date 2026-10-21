[BugFixes]
- The application log stream tab now stops after three failed
  connection attempts instead of opening a fourth connection and
  closing it at once, and it starts counting again after a successful
  connection. Before, a stream that connected and later dropped could
  stop reconnecting.
- The application log stream tab now says when it is retrying the
  connection (with the attempt number) and when it has given up,
  instead of showing "Connecting to log stream..." for good.

[Maintainability]
- Replaced the RxJS APIs deprecated in RxJS 7 (publishReplay/refCount,
  retryWhen, toPromise, multi-argument combineLatest and subscribe,
  the combineLatest operator, throwError with a value), the deprecated
  HttpClientModule, and the NgZone wrappers that do nothing in the
  zoneless app. Lint rules now reject them, and the theme package is
  linted.
