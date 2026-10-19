[BugFixes]
- The App Autoscaler pages work with autoscaler 14.x and 15.x:
  - The policy editor opens, shows the application's name, and lets
    you continue from the instance limits step.
  - The scaling history, metric charts and gauges load and draw.
  - Saving a policy keeps its custom metrics settings, offers only
    timezones the autoscaler accepts, and adds the cpuutil, disk and
    diskutil metrics with their limits.
  - Changes made while a saved policy is still loading, or before going
    back to the first step, are no longer lost.
  - Editing a rule with a percentage step shows the step instead of NaN.
  - A schedule's initial instance count can no longer exceed its maximum.
  - A refused change shows the autoscaler's reason.
  - After a policy is detached, the tab shows the default policy the
    autoscaler applies, if there is one.
  - The scaling history shows more than the newest 50 events.
- Removed Manage Credentials from the Autoscale tab; it failed on
  autoscaler 14.1.5 and later, which no longer have that API.
  Applications get custom metric credentials from their service binding.
