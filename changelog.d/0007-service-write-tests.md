[Chores]
- Service instance, binding and service key writes are now tested with
  Cloud Controller responses recorded on a live foundation, from a
  broker answering synchronously and one answering asynchronously,
  including broker failures. The backend replays them through its
  write handlers, and the frontend specs read what the backend
  returned. Each write is checked on the fast path and the polled
  path, and a broker's sync or async answer must give the user the
  same outcome. Known gaps are marked as expected failures: bind after
  create (#6001), and broker failure messages that differ between the
  two paths (#6002).
- A new E2E spec runs the create-service-instance wizard against a
  broker switched between synchronous and asynchronous responses
  (`services.testBroker` in the secrets profile; see
  `e2e/secrets.yaml.template`).
