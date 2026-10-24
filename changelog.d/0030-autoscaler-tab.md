[BugFixes: Applications]
- An autoscaler policy can pin an app to one instance count: the policy
  editor now accepts a minimum equal to the maximum, for the default
  limits and for both schedule types, as the autoscaler does.
- The Autoscale tab is laid out like the other application tabs: the
  rule count and the Edit, Delete and Create Policy actions sit in the
  same row as on Routes and Variables. The Latest Metrics gauges no
  longer run past their card, and the schedule tables scroll instead of
  cutting off their last column, with the edge shade the lists use to
  show there is more.

[Features: Applications]
- The Autoscale tab has a Now box beside Instances: the instance limits
  in effect (default or schedule) and when they next change, the last
  scaling event and its cool-down, and each metric's latest value
  against its scale-out and scale-in thresholds.

[Maintainability]
- The shared card header shows the shaded title band the other cards
  use by default; the cards that had no band keep their look with the
  new `plain` option.
