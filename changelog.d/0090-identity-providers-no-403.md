[BugFixes: Users and Roles]
- Opening Add User no longer logs a failed request in the browser
  console when the user may not list identity providers. The Identity
  Provider Origin field is a free-text box in that case, as before.
