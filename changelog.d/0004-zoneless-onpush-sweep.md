[BugFixes]
- Several pages kept their first render under zoneless change detection
  because an OnPush component wrote data that arrived later into plain
  fields, which never marks the view dirty. The affected fields are
  signals now. Visible effects fixed: the About page's EULA rendered
  blank; a Helm chart's details showed no versions and no schema notice;
  the markdown help panel on the endpoint connect dialogs stayed empty;
  the Edit Endpoint CA certificate toggle ignored the saved endpoint; the
  Metrics tab on an application and the Quota tab on a space could be
  missing; the add-route form's HTTP/TCP switch, a user-provided
  service's existing tags, a favourite card's invalid state, the profile
  form's password rules, and a disabled file input all lagged behind
  their data.
- Installing or upgrading a Helm release sat on "Loading ..." forever.
  The values editor built an observable from a signal inside its config
  input setter, which runs outside an injection context and threw
  NG0203 before the chart values were ever requested.
- The Helm chart catalog (Helm, Charts) said "There are no charts" and
  never requested them, and the Workloads release list had the same
  latent gap: both list configs compared a signal accessor to null
  instead of the signal's value, so the first-visit load was skipped.
- Opening `workloads/install/<endpoint>/<repo>/<chart>` without a version
  requested `versions/undefined` and failed; the page now resolves the
  chart's latest version.
