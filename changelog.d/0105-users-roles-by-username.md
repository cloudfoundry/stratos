[BugFixes]
- The organization and space Users tabs offer **Manage by Username**
  again. It opens the Manage Roles wizard on its Usernames step, where
  roles are added to or removed from users named by username, including
  users the list cannot select. The link was lost in 5.0.0 when the
  Users tabs were rebuilt; it shows, as in 4.x, when the
  `set_roles_by_username` or `unset_roles_by_username` feature flag is
  on and you may change roles in that organization or space.
- The organization and space Users tabs show the **Invite Users** card
  again when the endpoint has user invites configured. It was lost in
  5.0.0 along with Manage by Username.
- Namespace links in Kubernetes pod and service lists open the
  Namespaces tab filtered to that namespace. They used to lead to a
  namespace page that no longer exists and showed Page Not Found. In
  the namespace lists themselves the name is now plain text.
