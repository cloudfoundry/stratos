[BugFixes: Core]
- Icons draw at the size set for them. The side nav's are 18px,
  Diagnostics' 16px and icons in buttons 20px; they were all 24px. A
  type's font icon on the Home and Endpoints cards matches the images
  beside it, the "no applications" panel's icon is 48px again, and an
  empty page's icon is 96px again.
- Home shortcut icons show a pointer and return to 70% opacity. A
  service card's link icon is 16px, and the CaaSP version warning is
  20px with its gap and help cursor.
- An address wraps between its parts, not mid-word, on the Instance
  Address, the broker link, a route service URL, an error's URL and a
  chart's links. The Endpoints card shows an ellipsis on a cut-off
  address.
