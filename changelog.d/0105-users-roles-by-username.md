[BugFixes]
- The organization and space Users tabs offer **Manage by Username**
  again. It opens the Manage Roles wizard on its Usernames step, where
  roles are added to or removed from users named by username, including
  users the list cannot select. The link was lost in 5.0.0 when the
  Users tabs were rebuilt; it shows, as in 4.x, when the
  `set_roles_by_username` or `unset_roles_by_username` feature flag is
  on and you may change roles in that organization or space.
