[BugFixes: Users and Roles]
- Opening Add User no longer logs a failed request in the browser
  console when the user may not list identity providers. The Identity
  Provider Origin field is a free-text box in that case, as before.
- The Identity Provider Origin field in Add User now looks like the
  other fields: underlined, with a floating label, instead of a
  separate label over a boxed input.
