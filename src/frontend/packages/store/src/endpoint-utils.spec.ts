import { describe, expect, it } from 'vitest';

import { countDuplicateUrlEndpoints } from './endpoint-utils';
import { EndpointModel } from './types/endpoint.types';

function ep(host: string): EndpointModel {
  return { api_endpoint: { Scheme: 'https', Host: host, Path: '' } } as unknown as EndpointModel;
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
