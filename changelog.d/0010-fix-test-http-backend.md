[Chores]
- The unit test run printed some two hundred happy-dom AbortError stack
  traces: Angular gives every injector a root HttpClient on the fetch
  backend even when nothing provides one, so specs that never mention
  HttpClient still sent real requests that were aborted at teardown. The
  test platform now holds every request in the testing backend, the
  specs that provided their own real client pair it with the testing
  one, and the narrowed `make test frontend` run no longer ignores
  unhandled errors.
