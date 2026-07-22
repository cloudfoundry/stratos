import { describe, expect, it } from 'vitest';
import { organizationEntityType } from '../cf-entity-types';
import { selectCFEntity, selectCFEntities } from './cf-entity.selectors';

function makeState() {
  // getCFEntityKey('organization') yields 'cfOrganization' (camelCased CF_ENDPOINT_TYPE + capitalized entityType).
  return {
    request: {
      cfOrganization: {
        'cf-1:org-a': {
          metadata: { guid: 'org-a', url: '', created_at: '', updated_at: '' },
          entity: { name: 'A', status: 'active', guid: 'org-a', cfGuid: 'cf-1' },
        },
        'cf-2:org-a': {
          metadata: { guid: 'org-a', url: '', created_at: '', updated_at: '' },
          entity: { name: 'A-prime', status: 'active', guid: 'org-a', cfGuid: 'cf-2' },
        },
      },
    },
  };
}

describe('selectCFEntity', () => {
  it('returns the entity matching the composite key', () => {
    const selector = selectCFEntity(organizationEntityType, { cnsiGuid: 'cf-1', entityGuid: 'org-a' });
    const state = makeState();
    const out = selector(state as never) as { entity: { cfGuid: string; name: string } } | null;
    expect(out?.entity.cfGuid).toBe('cf-1');
    expect(out?.entity.name).toBe('A');
  });

  it('disambiguates across cnsiGuids with same bare entity guid', () => {
    const s1 = selectCFEntity(organizationEntityType, { cnsiGuid: 'cf-1', entityGuid: 'org-a' });
    const s2 = selectCFEntity(organizationEntityType, { cnsiGuid: 'cf-2', entityGuid: 'org-a' });
    const state = makeState();
    expect((s1(state as never) as { entity: { name: string } } | null)?.entity.name).toBe('A');
    expect((s2(state as never) as { entity: { name: string } } | null)?.entity.name).toBe('A-prime');
  });

  it('returns null for a non-existent composite', () => {
    const selector = selectCFEntity(organizationEntityType, { cnsiGuid: 'cf-missing', entityGuid: 'org-a' });
    expect(selector(makeState() as never)).toBeNull();
  });
});

describe('selectCFEntities', () => {
  it('returns entities present, skips missing', () => {
    const selector = selectCFEntities(organizationEntityType, [
      { cnsiGuid: 'cf-1', entityGuid: 'org-a' },
      { cnsiGuid: 'cf-2', entityGuid: 'org-a' },
      { cnsiGuid: 'cf-missing', entityGuid: 'org-a' },
    ]);
    const out = selector(makeState() as never) as Array<{ entity: { cfGuid: string } }>;
    expect(out).toHaveLength(2);
    expect(out.map(e => e.entity.cfGuid)).toEqual(['cf-1', 'cf-2']);
  });
});
