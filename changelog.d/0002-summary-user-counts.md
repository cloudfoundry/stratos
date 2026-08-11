[Bug Fixes]
- Fixed the Users count on the organization and space summary pages
  undercounting on foundations with more than 50 users. The summary tiles
  read a users snapshot that fetched only the first page of the paged
  users endpoint; the snapshot now drains every page, so the tile matches
  the Users tab. The organization tile also now counts users whose only
  grant in the org is a space role, matching what the Users tab lists.
- List pages no longer show a hard `0` in the header count while the
  first fetch is still in flight. The count renders as an ellipsis until
  the initial load completes, so a slow users or service-instances drain
  no longer reads as an empty list.

[Features]
- The User Service Instances tile on the space summary page is now
  clickable and navigates to the space's User Services tab, matching its
  sibling tiles.
