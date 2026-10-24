[BugFixes: Applications]
- An autoscaler policy can pin an app to one instance count: the policy
  editor now accepts a minimum equal to the maximum, for the default
  limits and for both schedule types, as the autoscaler does.
- The Autoscale tab is laid out like the other application tabs: the
  rule count and the Edit, Delete and Create Policy actions sit in the
  same row as on Routes and Variables, and the cards span the page. The
  Latest Metrics gauges no longer run past their card, and the schedule
  tables no longer cut off their last column.
