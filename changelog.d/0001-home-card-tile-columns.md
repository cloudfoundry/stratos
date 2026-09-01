[BugFixes]
- Counts on the home page endpoint cards no longer overflow into a horizontal
  scrollbar. Tile groups chose their column count from viewport media queries,
  so a card only 292px wide still laid its three counts out in three columns
  once the browser window passed 1024px — leaving each count 79px of a track it
  needed 161px for. The labels ran into one another and the remainder scrolled
  out of sight behind a scrollbar that reads as a divider. Columns are now
  fitted to the group's own width, so they wrap instead of overflowing, and the
  Kubernetes card's counts line up with the Favorites and Shortcuts panel below
  them the way the Cloud Foundry card's line up with its recent applications.
- The Kubernetes endpoint card now offers a `View Kubernetes Info` shortcut,
  matching the Cloud Foundry card's `View Cloud Foundry Info`. The cluster
  summary page was previously reachable only by clicking the card's header,
  which nothing advertised, and its own counts are now laid out to match the
  card they are reached from.
