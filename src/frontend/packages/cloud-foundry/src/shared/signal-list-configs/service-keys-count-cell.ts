import type { StServiceInstance } from '../../services/endpoint-data/stratos-types';

// Shared "Service Keys" count cell over a per-instance key count resolved
// lazily by the list config (CfServiceInstancesSignalConfigService
// .serviceKeyCount). The count rides in as an argument rather than off the row
// so the column's render stays a pure function the signal-list can re-invoke
// reactively when the count map fills in. Used by every service-instance list
// for consistency (services wall, CF services tab, space service-instances,
// offering instances). Mirrors the shape of bound-apps-cell.ts.
//
// The same module will later host the service-routes (route bindings) count —
// keep it generic enough to clone.

// undefined = count not yet loaded (or the fetch failed) → an em-dash so it
// reads as "unknown", distinct from a real "0" (instance has no keys).
export function renderServiceKeyCount(_si: StServiceInstance, count: number | undefined): string {
  return count === undefined ? '—' : String(count);
}

// Whole-cell link target to the instance's keys page, or null for
// user-provided instances (not bindable → no keys page exists for them).
export function serviceKeysLink(si: StServiceInstance): readonly (string | number)[] | null {
  if (si.type === 'user-provided') return null;
  return ['/services', 'service', si.cnsiGuid, si.guid, 'keys'];
}
