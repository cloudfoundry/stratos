[Chores]
- The end-to-end tests for user management now drive the redesigned
  Users tabs: Add User, Manage Roles and the bulk removes, at Cloud
  Foundry, organization and space level. The organization and space
  tests add and remove real roles inside an organization that each run
  creates and then deletes. The Cloud Foundry level removes act on
  every organization, so those tests open them and cancel. The new
  tests replace eight older specs that skipped themselves against the
  previous user-management screens.
- The organization and space Users tab tests also add and remove a
  role through Manage by Username.
