[BugFixes]
- Items per page shows a list's real page size. API Keys, which pages
  by 12, showed 5.
- A list row's ⋮ menu closes on a click outside it. Before, only
  Escape closed it.

[BugFixes: Accessibility]
- On the Register and Edit Endpoint forms, the fields of a collapsed
  Advanced Options or CA certificate section are out of the tab order
  and the accessibility tree.

[BugFixes: Endpoints]
- Reconnecting an endpoint clears its Expired mark and closes its
  re-authentication banners at once, instead of on the next page that
  calls Cloud Foundry.

[Features: Endpoints]
- Unregister from the endpoint card menu asks the same question as the
  Register step, with Keep it and Unregister.

[Features: API Keys]
- The API Keys page shows the key count and a labelled Create API Key
  button above the list, as the other list pages do, in place of the
  icon-only + in the page header.
