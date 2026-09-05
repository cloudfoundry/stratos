[BugFixes]
- Adding a user from another identity origin to an org failed for org
  managers with "user not found", while working for admins (#5883). The
  roles handler looked the user up through `GET /v3/users` before creating
  the role, and Cloud Foundry only shows an org manager the users already
  in their orgs. Adds now go to `POST /v3/roles` by username and origin
  and Cloud Foundry resolves the user itself, as the CF API intends for
  org managers. Removes still resolve the GUID, since a role is deleted by
  GUID and the user is a listable member by then. The org Users list now
  shows the new member as soon as the add succeeds, using the user GUID
  from the created role, instead of waiting for a manual refresh.

[Chores]
- fw-capi bumped v3.222.4 → v3.229.1, absorbing its breaking metadata
  change (`Metadata.Labels`/`Annotations` are now `map[string]*string`, so
  a nil value can delete a key on PATCH) and the corrected service plan
  visibility wire format (organizations as `{"guid": ...}` objects). The
  by-username role relationship this fix needs is fivetwenty-io/capi#15,
  consumed through a module replace on the fork until it is released.
