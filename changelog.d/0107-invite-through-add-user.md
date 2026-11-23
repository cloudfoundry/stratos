[Features: Users and Roles]
- Users are invited by email from **Add User** → **Invite**, which
  sets their roles like any other added user. The separate Invite Users
  page (`…/users/invite`), which nothing has linked to since 5.0.0, is
  removed; it offered no role at organization level and one role at
  space level.

[BugFixes]
- In the Add User dialog's Invite mode the user field is labelled
  **Email address** and accepts only an email address. After switching
  from Associate it kept the "Username" label and the username check.
- Add User offers **Invite** only to an administrator or a manager of
  the organization, the users Cloud Foundry lets invite. At Cloud
  Foundry level the invitation goes to the first organization picked
  in the dialog; it used to be sent with no organization and was
  always refused.
