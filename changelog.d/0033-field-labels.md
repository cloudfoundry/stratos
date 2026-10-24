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
- Controls that had no name at all now have one, taken from the
  caption, prompt or column a sighted user sees beside them:
  - Lists: each row's select checkbox or radio (named after the row),
    the select-all checkbox, the card view's Sort drop-down, the
    Items per page drop-down, and the range filter's type, comparison
    and value fields (named after the filtered column).
  - Confirmation dialogs that ask you to type a name: the field is
    labelled by its "Please type ... to continue." prompt.
  - Register Endpoint and Edit Endpoint: the CA certificate box is
    labelled by its "Specify CA Certificate:" caption.
  - Forms built from a service's JSON schema: yes/no checkboxes, the
    JSON fallback box and the oneOf choice are labelled by the field's
    label; array and tuple items and a oneOf value are named after the
    field.
  - Kubernetes endpoint credentials: the certificate, key and token
    boxes and the kubeconfig, certificate and GKE credentials file
    pickers are named by their captions.
  - Import Kubeconfig: the box for renaming a cluster.
- Drop-downs built on the shared select had no name at all: a screen
  reader announced only the chosen value. Each is now named after its
  placeholder, or where it has none after the caption or column beside
  it: Backup Endpoints' Connection Details, the metrics Time window,
  the service wizard's Service, Service Plan and App, and Import
  Kubeconfig's Type and User.
