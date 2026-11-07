[BugFixes]
- The page tabs on application, space, organization and other detail
  pages now work from the keyboard every time. Each tab used to take
  two Tab stops, and the first one, where the focus outline showed,
  ignored Enter; those stops also came before the rest of the page.
  Each tab is now one stop in page order, a hidden tab leaves no empty
  list item, and the current tab is announced as the current page.
