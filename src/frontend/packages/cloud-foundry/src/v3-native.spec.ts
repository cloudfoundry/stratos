import { describe, expect, it } from 'vitest';

import {
  getActionEndpoint,
  v3PaginationConfig,
  v3ToStratosShape,
  V3PagedResponse,
} from './v3-native';

describe('v3ToStratosShape', () => {
  it('produces Stratos shape from a flat V3 resource with no renames', () => {
    interface FlatOrg {
      guid: string;
      name: string;
      created_at: string;
      updated_at: string;
    }
    const adapter = v3ToStratosShape<FlatOrg>({});
    const v3 = {
      guid: 'org-1',
      name: 'my-org',
      created_at: '2026-04-29T10:00:00Z',
      updated_at: '2026-04-29T11:00:00Z',
    };

    const result = adapter(v3);

    expect(result).toEqual({
      metadata: {
        guid: 'org-1',
        url: '',
        created_at: '2026-04-29T10:00:00Z',
        updated_at: '2026-04-29T11:00:00Z',
      },
      entity: {
        guid: 'org-1',
        name: 'my-org',
        created_at: '2026-04-29T10:00:00Z',
        updated_at: '2026-04-29T11:00:00Z',
      },
    });
  });

  it('renames camelCase V3 fields to V2 names per the rename map', () => {
    interface FlatSpace {
      guid: string;
      name: string;
      relationships: { organization: { data: { guid: string } } };
    }
    const adapter = v3ToStratosShape<FlatSpace>({
      // V3 path → V2 entity field
      'relationships.organization.data.guid': 'organization_guid',
    });
    const v3 = {
      guid: 'space-1',
      name: 'dev',
      relationships: { organization: { data: { guid: 'org-1' } } },
    };

    const result = adapter(v3);

    expect(result.entity.organization_guid).toBe('org-1');
    expect(result.entity.guid).toBe('space-1');
    expect(result.entity.name).toBe('dev');
    expect(result.metadata.guid).toBe('space-1');
  });

  it('treats missing created_at/updated_at as empty strings', () => {
    const adapter = v3ToStratosShape<{ guid: string }>({});
    const result = adapter({ guid: 'x' });
    expect(result.metadata.created_at).toBe('');
    expect(result.metadata.updated_at).toBe('');
    expect(result.metadata.url).toBe('');
  });

  it('maps camelCase Stratos createdAt/updatedAt to snake_case metadata for V2 consumer compatibility', () => {
    interface StratosFlat {
      guid: string;
      name: string;
      createdAt: string;
      updatedAt: string;
    }
    const adapter = v3ToStratosShape<StratosFlat>({});
    const result = adapter({
      guid: 'x',
      name: 'thing',
      createdAt: '2026-04-29T10:00:00Z',
      updatedAt: '2026-04-29T11:00:00Z',
    });
    expect(result.metadata.created_at).toBe('2026-04-29T10:00:00Z');
    expect(result.metadata.updated_at).toBe('2026-04-29T11:00:00Z');
  });
});

describe('v3PaginationConfig', () => {
  const buildPage = (total_pages: number, total_results: number, resources: { guid: string }[]): V3PagedResponse<{ guid: string }> => ({
    pagination: { total_pages, total_results },
    resources,
  });

  it('extracts resources from a V3 paged response', () => {
    const resp = buildPage(5, 234, [{ guid: 'a' }, { guid: 'b' }]);
    expect(v3PaginationConfig.getEntitiesFromResponse(resp)).toEqual([{ guid: 'a' }, { guid: 'b' }]);
  });

  it('reads total_pages from pagination.* across endpoints, taking the max', () => {
    const jetstreamResponse = {
      'cnsi-1': buildPage(5, 234, []),
      'cnsi-2': buildPage(8, 412, []),
    };
    expect(v3PaginationConfig.getTotalPages(jetstreamResponse)).toBe(8);
  });

  it('handles per-endpoint values that are arrays of pages (from prior fetches)', () => {
    const jetstreamResponse = {
      'cnsi-1': [buildPage(3, 10, []), buildPage(3, 10, [])],
    };
    expect(v3PaginationConfig.getTotalPages(jetstreamResponse)).toBe(3);
  });

  it('reads total_results from pagination.* and sums across endpoints', () => {
    const jetstreamResponse = {
      'cnsi-1': buildPage(5, 234, []),
      'cnsi-2': buildPage(8, 412, []),
    };
    expect(v3PaginationConfig.getTotalEntities(jetstreamResponse)).toBe(234 + 412);
  });

  it('emits page=N and per_page=100 params for V3 paging', () => {
    expect(v3PaginationConfig.getPaginationParameters(3)).toEqual({ page: '3', per_page: '100' });
  });
});

describe('v3PaginationConfig composed with v3ToStratosShape', () => {
  it('produces Stratos-shape resources from a V3 paged response in one chain', () => {
    interface FlatOrg {
      guid: string;
      name: string;
      created_at: string;
      updated_at: string;
    }
    const adapter = v3ToStratosShape<FlatOrg>({});
    const v3Response: V3PagedResponse<FlatOrg> = {
      pagination: { total_pages: 1, total_results: 2 },
      resources: [
        { guid: 'org-1', name: 'first', created_at: '2026-04-29T00:00:00Z', updated_at: '2026-04-29T00:00:00Z' },
        { guid: 'org-2', name: 'second', created_at: '2026-04-29T00:00:00Z', updated_at: '2026-04-29T00:00:00Z' },
      ],
    };

    const stratosResources = v3PaginationConfig.getEntitiesFromResponse(v3Response).map(adapter);

    expect(stratosResources).toHaveLength(2);
    expect(stratosResources[0].metadata.guid).toBe('org-1');
    expect(stratosResources[0].entity.name).toBe('first');
    expect(stratosResources[1].metadata.guid).toBe('org-2');
  });
});

describe('getActionEndpoint', () => {
  it('returns endpointGuid when set', () => {
    expect(getActionEndpoint({ endpointGuid: 'cnsi-1' })).toBe('cnsi-1');
  });

  it('falls back to cnsiGuid when endpointGuid is absent', () => {
    expect(getActionEndpoint({ cnsiGuid: 'cnsi-2' })).toBe('cnsi-2');
  });

  it('prefers endpointGuid over cnsiGuid when both are present', () => {
    expect(getActionEndpoint({ endpointGuid: 'preferred', cnsiGuid: 'fallback' })).toBe('preferred');
  });

  it('throws when neither field is set', () => {
    expect(() => getActionEndpoint({})).toThrow(/cnsi/i);
  });
});

