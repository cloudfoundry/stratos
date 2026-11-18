import { describe, expect, it } from 'vitest';

import { countDuplicateUrlEndpoints, endpointUrlKey, formatDuplicateUrlEndpointsMessage } from './endpoint-utils';
import { EndpointModel } from './types/endpoint.types';

function ep(host: string, type: string = 'cf'): EndpointModel {
  return { cnsi_type: type, api_endpoint: { Scheme: 'https', Host: host, Path: '' } } as unknown as EndpointModel;
}

describe('countDuplicateUrlEndpoints', () => {
  it('returns null for fewer than two endpoints', () => {
    expect(countDuplicateUrlEndpoints([])).toBeNull();
    expect(countDuplicateUrlEndpoints([ep('a.example.com')])).toBeNull();
  });

  it('returns null when all URLs are distinct', () => {
    expect(countDuplicateUrlEndpoints([ep('a.example.com'), ep('b.example.com')])).toBeNull();
  });

  it('counts endpoints whose URL is shared by another endpoint', () => {
    // Two share api.shared, one is unique → 2 endpoints in a duplicate group.
    expect(
      countDuplicateUrlEndpoints([ep('api.shared'), ep('api.shared'), ep('api.unique')]),
    ).toBe(2);
  });

  it('counts all members across multiple duplicate groups', () => {
    expect(
      countDuplicateUrlEndpoints([ep('x'), ep('x'), ep('y'), ep('y'), ep('z')]),
    ).toBe(4);
  });
});

describe('formatDuplicateUrlEndpointsMessage', () => {
  it('names one shared URL when a type has a single duplicate group', () => {
    const msg = formatDuplicateUrlEndpointsMessage([ep('shared'), ep('shared'), ep('shared'), ep('shared')]);
    expect(msg).toMatch(/^A \S+ URL is shared by 4 endpoints\.$/);
  });

  // Real-world case (fw-lab-norm, 07-26): 4 endpoints on one CF api URL plus
  // 4 different endpoints on a second, unrelated CF api URL — 8 endpoints
  // total but two disjoint pairs, not one group of 8 that all relate to each
  // other. Lumping them into "8 X endpoints share URLs" is misleading: it
  // reads as if all 8 are interconnected. The message must surface that
  // there are 2 separate URLs involved.
  it('names the group sizes when one type has multiple disjoint duplicate groups', () => {
    const msg = formatDuplicateUrlEndpointsMessage([
      ep('url-a'), ep('url-a'), ep('url-a'), ep('url-a'),
      ep('url-b'), ep('url-b'), ep('url-b'), ep('url-b'),
    ]);
    expect(msg).toMatch(/^2 \S+ URLs are shared by 8 endpoints \(4 and 4 per URL\)\.$/);
  });

  // "11 across 3 URLs" alone invites a false assumption that the 3 groups
  // are roughly equal-sized. Only listing the actual sizes rules that out.
  // Leading with the URL count (3) makes the shape unambiguous up front.
  it('lists uneven group sizes rather than just a group count', () => {
    const msg = formatDuplicateUrlEndpointsMessage([
      ep('url-a'), ep('url-a'),
      ep('url-b'), ep('url-b'), ep('url-b'), ep('url-b'),
      ep('url-c'), ep('url-c'), ep('url-c'), ep('url-c'), ep('url-c'),
    ]);
    expect(msg).toMatch(/^3 \S+ URLs are shared by 11 endpoints \(2, 4, and 5 per URL\)\.$/);
  });

  // Repeated sizes (two groups that happen to both have 3 endpoints) must
  // stay listed plainly, not deduped or collapsed - "3 and 5" would hide
  // that there are actually 2 separate groups of 3 plus 1 group of 5.
  it('lists repeated group sizes without deduping them', () => {
    const msg = formatDuplicateUrlEndpointsMessage([
      ep('url-a'), ep('url-a'), ep('url-a'),
      ep('url-b'), ep('url-b'), ep('url-b'),
      ep('url-c'), ep('url-c'), ep('url-c'), ep('url-c'), ep('url-c'),
    ]);
    expect(msg).toMatch(/^3 \S+ URLs are shared by 11 endpoints \(3, 3, and 5 per URL\)\.$/);
  });

  // "X endpoints AND Y endpoints share URLs" reads as one joint action
  // between the two groups - as if a CF endpoint and a k8s endpoint were
  // sharing a URL with each other. They never are (duplicate detection is
  // strictly within a type). Each type must be its own independent clause,
  // with its own subject and verb, so nothing implies a cross-type relation.
  it('gives each type its own independent clause instead of one shared verb', () => {
    const msg = formatDuplicateUrlEndpointsMessage([
      ep('cf-shared'), ep('cf-shared'),
      ep('kube-shared', 'k8s'), ep('kube-shared', 'k8s'), ep('kube-shared', 'k8s'),
    ]);
    expect(msg).toMatch(/^A \S+ URL is shared by 2 endpoints; A \S+ URL is shared by 3 endpoints\.$/);
  });

  // Real-world case (fw-lab-norm, 07-26): 8 CF endpoints across 2 disjoint
  // URL groups, plus 4 unrelated Kubernetes endpoints on a third URL. The
  // old phrasing ("8 Cloud Foundry endpoints and 4 Kubernetes endpoints
  // share URLs.") reads as if all 12 endpoints share one URL together.
  it('stays accurate for multiple types where one also has multiple groups', () => {
    const msg = formatDuplicateUrlEndpointsMessage([
      ep('cf-url-a'), ep('cf-url-a'), ep('cf-url-a'), ep('cf-url-a'),
      ep('cf-url-b'), ep('cf-url-b'), ep('cf-url-b'), ep('cf-url-b'),
      ep('kube-url', 'k8s'), ep('kube-url', 'k8s'), ep('kube-url', 'k8s'), ep('kube-url', 'k8s'),
    ]);
    expect(msg).toMatch(/^2 \S+ URLs are shared by 8 endpoints \(4 and 4 per URL\); A \S+ URL is shared by 4 endpoints\.$/);
  });

  // Several autoscalers for one service broker of one Cloud Foundry are the
  // same autoscaler registered more than once, whatever addresses they use.
  it('counts endpoints linked to one service broker as sharing it', () => {
    const linked = (host: string, broker: string) => ({
      ...ep(host, 'autoscaler'), endpoint_metadata: { cf_guid: 'cf-1', broker_guid: broker },
    } as EndpointModel);
    expect(formatDuplicateUrlEndpointsMessage([linked('as-1.sys.x.com', 'b1'), linked('as-2.sys.x.com', 'b1')]))
      .toMatch(/^A \S+ service broker is shared by 2 endpoints\.$/);
    expect(formatDuplicateUrlEndpointsMessage([linked('as-1.sys.x.com', 'b1'), linked('as-2.sys.x.com', 'b2')]))
      .toBeNull();
  });

  it('returns null when no URLs are shared', () => {
    expect(formatDuplicateUrlEndpointsMessage([ep('a'), ep('b')])).toBeNull();
  });
});

// Same cases as the backend's TestEndpointURLKey: both sides must agree on
// which addresses are the same.
describe('endpointUrlKey', () => {
  it.each([
    ['https://api.example.com', 'https://API.Example.com', true],
    ['https://api.example.com', 'HTTPS://api.example.com', true],
    ['https://api.example.com', 'https://api.example.com:443', true],
    ['http://api.example.com', 'http://api.example.com:80', true],
    ['https://github.com/norman-abramovitz', 'https://github.com//norman-abramovitz', true],
    ['https://x.example.com', 'https://x.example.com/', true],
    ['https://x.example.com/cf', 'https://x.example.com/cf/', true],
    ['https://api.example.com', 'https://api.example.com?a=b#c', true],
    ['https://[::1]', 'https://[::1]:443', true],
    ['https://api.example.com', 'https://api.example.com:8443', false],
    ['https://api.example.com:8443', 'https://api.example.com:9443', false],
    ['http://api.example.com', 'https://api.example.com', false],
    ['https://x.example.com/cf', 'https://x.example.com/cf2', false],
    ['https://x.example.com/cf', 'https://x.example.com', false],
  ])('%s vs %s → same: %s', (a, b, same) => {
    expect(endpointUrlKey(a) === endpointUrlKey(b)).toBe(same);
  });

  it('reads a typed address without a scheme as https, as registration does', () => {
    expect(endpointUrlKey(' API.example.com/ ')).toBe(endpointUrlKey('https://api.example.com'));
  });

  it('counts addresses that differ only in host case and a default port as one shared URL', () => {
    const upper = { cnsi_type: 'cf', api_endpoint: { Scheme: 'https', Host: 'API.sys.example.com:443', Path: '/' } } as unknown as EndpointModel;
    expect(countDuplicateUrlEndpoints([ep('api.sys.example.com'), upper])).toBe(2);
  });
});
