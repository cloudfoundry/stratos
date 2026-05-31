import { EndpointModel } from './types/endpoint.types';

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
  if (!endpoints || endpoints.length < 2) {
    return null;
  }
  const urlCounts = new Map<string, number>();
  for (const ep of endpoints) {
    const url = getFullEndpointApiUrl(ep);
    urlCounts.set(url, (urlCounts.get(url) ?? 0) + 1);
  }
  let dupCount = 0;
  for (const count of urlCounts.values()) {
    if (count > 1) {
      dupCount += count;
    }
  }
  return dupCount > 0 ? dupCount : null;
}
