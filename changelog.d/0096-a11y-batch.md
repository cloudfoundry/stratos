[BugFixes: Accessibility]
- A tooltip goes away at once on Escape, and when the pointer moves off
  its control. Before, it stayed on screen until something else redrew
  the page.
- Text and colors reach 7:1. The muted grey is darker (#475569), and the
  blue of links and buttons is darker (#1e40af). In dark mode, the muted
  text (#cbd5e1) and the blues (#93c5fd, #7dd3fc) are lighter.
- The edge of a field (the line under a form field, the border of a
  list's filter and select boxes) reaches 3:1, in light and dark mode.
- A focused form field has an outline round the whole field. A faded
  control, such as a paging button with nowhere to go, shows its focus
  outline at full strength.
- Headings: every page title is a heading, a list's title ("Total
  Applications: 4") is a heading, and a form step has a heading for
  screen readers. The page header is a header landmark.
- Screen readers say how many results a filter leaves, and the new
  desired count after an app is scaled.
- Links with the same text are told apart for screen readers: an app's
  endpoint, org and space in the Applications list, and a page tab and
  the side nav link with the same name.
- The cards on an application's summary are named groups.
- Links stacked in one list cell are 24 px tall.
- CF, SSH, GUID, URL, EKS and AKS show their expansion on hover and to
  screen readers.
- The user menu button's name no longer includes the avatar initials,
  and the Row actions button no longer claims to open a menu.
