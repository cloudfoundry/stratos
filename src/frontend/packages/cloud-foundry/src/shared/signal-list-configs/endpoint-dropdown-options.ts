import { naturalCompare, type SignalListDropdownOption } from '@stratosui/core';
import type { EndpointModel } from '@stratosui/store';

/**
 * Builds the endpoint filter options for a Cloud Foundry list toolbar.
 *
 * The endpoints arrive in the order the backend returned them — neither
 * `listCNSIs` nor `listCNSIsByUser` carries an ORDER BY, and the store keeps
 * them in a Map, which preserves insertion order. With one endpoint that is
 * invisible; with two or more the dropdown order is arbitrary and can differ
 * between queries. Sorting by label puts it in the order a reader expects,
 * and matches the sibling dropdowns on these same toolbars (stacks, and the
 * rest) which already sort with naturalCompare.
 *
 * "All" stays pinned to the top: it is the reset, not a peer of the endpoints.
 */
export function endpointDropdownOptions(
  endpoints: readonly EndpointModel[] | null | undefined,
): SignalListDropdownOption[] {
  const named = (endpoints ?? []).map(ep => ({
    label: ep.name ?? ep.guid ?? '',
    value: ep.guid ?? null,
  }));
  named.sort((a, b) => naturalCompare(a.label, b.label));
  return [{ label: 'All', value: null }, ...named];
}
