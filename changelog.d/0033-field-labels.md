[BugFixes: Accessibility]
- Text fields that were named only by their placeholder now have a
  name of their own. A placeholder disappears as soon as you type (and
  a date or time field never shows it), so a screen reader had nothing
  to announce and a sighted user had nothing left to read. Fields with
  room for it get a visible label above the box; fields set inline in
  a sentence, a toolbar or a list get a name screen readers announce:
  - Deploy Application, Options step: every field, and the Domain,
    Stack and Health Check Type drop-downs (visible labels).
  - Configure User Invite Client: Client ID and Client Secret (visible
    labels).
  - Autoscaler policy editor: the recurring and specific date
    schedules' time, date and instance count fields (visible labels),
    the custom From and To dates, and the scaling rule fields. The
    Repeat On label now names the weekday or month-day list.
  - Install Chart: Name and Namespace (visible labels) and the cluster
    drop-down.
  - Service Keys: the new key's name.
  - Manage Users and Add User roles: the organization search and each
    organization's space filter, which names its organization.
  - Metrics range selector: the start and end date and time fields,
    grouped as Start and End.
  - File pickers: the path field.
  - Forms built from a service's JSON schema: the key and value of each
    map row.
