[BugFixes]
- Deleting a user-provided service instance reported "Delete failed:
  deleting service instance: no Location header on async delete
  response", although CF had deleted it. CF answers that delete with
  204 No Content and no job; the CF API client now treats that as
  done. This failed in every release since 5.0.0.
- The user-provided service instance wizard stayed on its last step
  after Finish, with no message, although CF had created or updated
  the instance. It now closes once CF has the change.
- The user-provided service instance form shows its Tags field, gives
  each field's own error ("Invalid URL", "A service instance with this
  name already exists...") instead of a generic one, and accepts
  `syslog://` and `syslog-tls://` drain URLs, as CF does.
- The user-provided service instance form accepted an `http://` route
  service URL, which CF then rejected; it now requires `https`, as CF
  does.
- 15 forms showed a generic line ("Invalid value", "Please enter a
  valid format") instead of their own error text, such as a taken name
  or a bad API address. They now show their own text, and screen
  readers announce it as the field's error.
- The first navigation after loading or refreshing a page rebuilt the
  whole page, side navigation and top bar included, instead of only the
  part that changed.

[Chores]
- The CF API client (capi) is taken from a fork commit carrying the
  user-provided delete fix until a capi release includes it.
- The marketplace and service e2e specs that could not fail (calls to
  helpers the fixture never provided, `expect(true)`, dialogs closed
  before acting) are replaced by tests that change real instances and
  check the result in CF: slow updates and deletes, user-provided
  create, edit and delete, binding, managed edit, and the marketplace
  and services list filters.
