import { entityCatalog } from './entity-catalog/entity-catalog';
import { EndpointModel } from './types/endpoint.types';

const listFormat = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });

export function getFullEndpointApiUrl(endpoint: EndpointModel) {
  return endpoint && endpoint.api_endpoint ?
    `${endpoint.api_endpoint.Scheme}://${endpoint.api_endpoint.Host}${endpoint.api_endpoint.Path}` : 'Unknown';
}

/**
 * What two endpoint addresses are compared by: scheme and host in lower
 * case, no default port, no repeated or trailing slash, no query or
 * fragment. A typed address without a scheme is read as https, as
 * registration does. Stored and displayed addresses keep their form. The
 * backend's endpointURLKey applies the same rules.
 */
export function endpointUrlKey(address: string | null | undefined): string {
  const trimmed = (address ?? '').trim();
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  if (!URL.canParse(withScheme)) {
    return trimmed;
  }
  // URL already lower-cases the scheme and host and drops a default port.
  const u = new URL(withScheme);
  const user = u.username ? `${u.username}${u.password ? `:${u.password}` : ''}@` : '';
  return `${u.protocol}//${user}${u.host}${u.pathname.replace(/\/{2,}/g, '/').replace(/\/+$/, '')}`;
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
 * {@link countDuplicateUrlEndpoints} returns), `sizes` is each distinct
 * group's own endpoint count (e.g. `[2, 4, 5]` for three separate shared
 * URLs with 2, 4, and 5 endpoints respectively) - the total and group count
 * alone ("11 across 3 URLs") invite a false assumption that the groups are
 * roughly equal-sized; only the actual sizes rule that out. Null when all
 * URLs are distinct.
 */
export function duplicateUrlStats(endpoints: EndpointModel[]): { count: number; sizes: number[] } | null {
  if (!endpoints || endpoints.length < 2) {
    return null;
  }
  const urlCounts = new Map<string, number>();
  for (const ep of endpoints) {
    const url = endpointUrlKey(getFullEndpointApiUrl(ep));
    urlCounts.set(url, (urlCounts.get(url) ?? 0) + 1);
  }
  const sizes = [...urlCounts.values()].filter(count => count > 1).sort((a, b) => a - b);
  const dupCount = sizes.reduce((sum, size) => sum + size, 0);
  return dupCount > 0 ? { count: dupCount, sizes } : null;
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
 * one independent clause per type, e.g. "A Cloud Foundry URL is shared by
 * 4 endpoints." or, with more than one group, "3 Cloud Foundry URLs are
 * shared by 11 endpoints (2, 4, and 5 per URL)." Both forms lead with the
 * URL(s) as the subject, so the single- and multi-group phrasing stay
 * parallel. Two design choices this encodes:
 *
 * - Each type is its own clause with its own verb rather than one shared
 *   verb across an "and"-joined list - a CF endpoint and a k8s endpoint
 *   never share a URL with each other (duplicate detection is strictly
 *   within a type), so joining them with "and...share URLs" would read as
 *   if they did.
 * - A multi-group type names every group's actual size, not just the
 *   group count - "11 across 3 URLs" invites a false assumption that the
 *   groups are roughly equal-sized (they might be 2, 4, and 5).
 *
 * Null when all URLs are distinct.
 */
export function formatDuplicateUrlEndpointsMessage(endpoints: EndpointModel[]): string | null {
  const dups = countDuplicateUrlEndpointsByType(endpoints);
  if (!dups.length) {
    return null;
  }
  const clauses = dups.map(dup => {
    const label = entityCatalog.getEndpoint(dup.type)?.definition?.label ?? dup.type;
    const [one, many, per] = dup.shared === 'broker'
      ? ['service broker', 'service brokers', 'broker'] : ['URL', 'URLs', 'URL'];
    if (dup.sizes.length === 1) {
      return `A ${label} ${one} is shared by ${dup.count} endpoints`;
    }
    const sizesList = listFormat.format(dup.sizes.map(String));
    return `${dup.sizes.length} ${label} ${many} are shared by ${dup.count} endpoints (${sizesList} per ${per})`;
  });
  return `${clauses.join('; ')}.`;
}

/**
 * An endpoint linked to a Cloud Foundry service broker (an autoscaler: its
 * metadata holds cf_guid and broker_guid) is the same service as any other
 * endpoint linked to that broker, whatever its URL.
 */
function brokerKey(ep: EndpointModel): string | null {
  const meta = ep.endpoint_metadata;
  return meta?.cf_guid && meta?.broker_guid ? `${meta.cf_guid}/${meta.broker_guid}` : null;
}

function sharedStats(keys: string[]): { count: number; sizes: number[] } | null {
  const counts = new Map<string, number>();
  keys.forEach(key => counts.set(key, (counts.get(key) ?? 0) + 1));
  const sizes = [...counts.values()].filter(count => count > 1).sort((a, b) => a - b);
  const count = sizes.reduce((sum, size) => sum + size, 0);
  return count > 0 ? { count, sizes } : null;
}

export function countDuplicateUrlEndpointsByType(
  endpoints: EndpointModel[],
): { type: string; count: number; sizes: number[]; shared?: 'broker' }[] {
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
  const counts: { type: string; count: number; sizes: number[]; shared?: 'broker' }[] = [];
  for (const [type, group] of byType) {
    const linked = group.filter(ep => brokerKey(ep));
    const stats = duplicateUrlStats(group.filter(ep => !brokerKey(ep)));
    if (stats) {
      counts.push({ type, ...stats });
    }
    const brokerStats = sharedStats(linked.map(ep => brokerKey(ep)!));
    if (brokerStats) {
      counts.push({ type, ...brokerStats, shared: 'broker' });
    }
  }
  return counts;
}
