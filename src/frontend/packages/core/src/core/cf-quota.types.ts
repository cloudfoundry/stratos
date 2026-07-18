// CF quota APIs encode 'unlimited' as -1 (memory_limit, total_services, ...).
// Values arrive as plain numbers off the API, so this stays a runtime guard
// rather than a type-level union. Same shape as PAGE_SIZE_ALL in
// signal-list/page-size.types.ts.
export const CF_QUOTA_UNLIMITED = -1;

/** True when a CF quota value means 'unlimited' rather than a literal limit. */
export function isUnlimited(value: number): boolean {
  return value === CF_QUOTA_UNLIMITED;
}
