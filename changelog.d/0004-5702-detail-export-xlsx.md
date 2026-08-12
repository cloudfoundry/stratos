[Features]
- The named detail export on the Foundational Shape page now has a spreadsheet
  form alongside the JSON: one workbook with the tree flattened to a sheet per
  entity type (overview with drain stamps and totals, organizations, spaces,
  apps, service instances, service bindings, role grants). It passes the same
  CF-admin-only confirmation as the JSON form, a never-run drain's sheet is
  absent rather than empty, and orphaned children stay visible with an
  `(orphaned)` marker in their parent columns.
