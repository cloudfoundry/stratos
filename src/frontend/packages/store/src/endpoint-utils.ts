import { entityCatalog } from './entity-catalog/entity-catalog';
import { EndpointModel } from './types/endpoint.types';

const listFormat = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });

export function getFullEndpointApiUrl(endpoint: EndpointModel) {
  return endpoint && endpoint.api_endpoint ?
    `${endpoint.api_endpoint.Scheme}://${endpoint.api_endpoint.Host}${endpoint.api_endpoint.Path}` : 'Unknown';
}

/**
 * Counts endpoints whose api_url appears 2+ times across the given set — i.e.
 * the number of endpoints sitting in a "shared URL" group. Returns `null`
 * when all URLs are distinct so callers can early-exit (e.g. `@if … as count`).
 *
 * Shared by the CF duplicate-URL banner (Application Wall / Marketplace /
 * Services) and the home-page banner, so the detection lives in one place.
 */
export function countDuplicateUrlEndpoints(endpoints: EndpointModel[]): number | null {
  return duplicateUrlStats(endpoints)?.count ?? null;
}

/**
 * Shared-URL detection with enough detail for grammatical banners: `count`
 * is the number of endpoints sitting in a shared-URL group (what
 * {@link countDuplicateUrlEndpoints} returns), `groups` is how many distinct
 * URLs are shared. 4 endpoints in one group "share a URL"; 2+2 across two
 * groups "share URLs". Null when all URLs are distinct.
 */
export function duplicateUrlStats(endpoints: EndpointModel[]): { count: number; groups: number } | null {
  if (!endpoints || endpoints.length < 2) {
    return null;
  }
  const urlCounts = new Map<string, number>();
  for (const ep of endpoints) {
    const url = getFullEndpointApiUrl(ep);
    urlCounts.set(url, (urlCounts.get(url) ?? 0) + 1);
  }
  let dupCount = 0;
  let groups = 0;
  for (const count of urlCounts.values()) {
    if (count > 1) {
      dupCount += count;
      groups++;
    }
  }
  return dupCount > 0 ? { count: dupCount, groups } : null;
}

/**
 * Per-endpoint-type variant of {@link countDuplicateUrlEndpoints}: URL
 * sharing is only meaningful within a type (a CF and a k8s endpoint on the
 * same host are not duplicates of each other), so the detection runs per
 * cnsi_type. Returns one entry per type that has any shared-URL endpoints;
 * empty when all URLs are distinct.
 */
/**
 * The shared-URL banner sentence, built the same way everywhere it appears
 * (home page and the CF Application Wall / Marketplace / Services banner):
 * per-type counts joined into one sentence with the verb agreeing with how
 * many distinct URLs are shared, e.g. "4 Cloud Foundry endpoints share a
 * URL." or "4 Cloud Foundry endpoints and 4 Kubernetes endpoints share
 * URLs." Null when all URLs are distinct.
 */
export function formatDuplicateUrlEndpointsMessage(endpoints: EndpointModel[]): string | null {
  const dups = countDuplicateUrlEndpointsByType(endpoints);
  if (!dups.length) {
    return null;
  }
  const parts = dups.map(dup =>
    `${dup.count} ${entityCatalog.getEndpoint(dup.type)?.definition?.label ?? dup.type} endpoints`);
  const totalGroups = dups.reduce((sum, dup) => sum + dup.groups, 0);
  return `${listFormat.format(parts)} ${totalGroups > 1 ? 'share URLs' : 'share a URL'}.`;
}

export function countDuplicateUrlEndpointsByType(endpoints: EndpointModel[]): { type: string; count: number; groups: number }[] {
  if (!endpoints || endpoints.length < 2) {
    return [];
  }
  const byType = new Map<string, EndpointModel[]>();
  for (const ep of endpoints) {
    const type = ep.cnsi_type ?? 'unknown';
    const group = byType.get(type);
    if (group) {
      group.push(ep);
    } else {
      byType.set(type, [ep]);
    }
  }
  const counts: { type: string; count: number; groups: number }[] = [];
  for (const [type, group] of byType) {
    const stats = duplicateUrlStats(group);
    if (stats) {
      counts.push({ type, ...stats });
    }
  }
  return counts;
}
