import { describe, expect, it } from 'vitest';

import { countDuplicateUrlEndpoints, formatDuplicateUrlEndpointsMessage } from './endpoint-utils';
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

  it('returns null when no URLs are shared', () => {
    expect(formatDuplicateUrlEndpointsMessage([ep('a'), ep('b')])).toBeNull();
  });
});
