[BugFixes]
- Add User let an org or space manager submit a username with no role
  ticked, and the add then failed with "user not found" because Cloud
  Foundry only lets an administrator add a user without granting a
  role. The dialog now asks such a user to grant at least one role
  before it will submit (#5893).
