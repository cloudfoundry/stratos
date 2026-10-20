[Features]
- One users cache per endpoint serves the summary tiles, the Users tabs
  and the role dialogs, so the CF Users tab no longer reads every user
  again after the summary pages or the home page have loaded them.
- A space's summary page reads the space, its app and route counts and
  its SSH setting at the same time, and takes each count from one small
  request. On a space with 1,500 apps and 1,500 routes the page took
  6.9 s; it now takes under 1 s.
- An organization's Spaces tab reuses the spaces list the organization
  page has already read, instead of reading it again, and the
  organization page no longer waits for that list before showing its
  tabs.
- The org and space summary pages show "–" in their Spaces and role
  tiles while the data loads, instead of "0" or "None".

[BugFixes]
- An organization with more than 50 spaces now shows all of them. Its
  Spaces tile, the Applications, App Instances and Memory tiles (which
  count apps by space) and the Apply Quota to Spaces dialog read only
  the first 50 spaces.
