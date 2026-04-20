import { describe, expect, it } from 'vitest';
import { APIResource } from '../../../../store/src/types/api.types';
import { getAPIResourceGuid, getCFCompositeEntityId } from './api.selectors';

function makeResource(guid: string, cfGuid?: string): APIResource {
  return {
    metadata: {
      guid,
      url: '',
      created_at: '',
      updated_at: '',
    },
    entity: {
      guid,
      ...(cfGuid ? { cfGuid } : {}),
    },
  };
}

describe('getAPIResourceGuid', () => {
  it('returns bare metadata guid', () => {
    expect(getAPIResourceGuid(makeResource('org-a'))).toBe('org-a');
  });
});

describe('getCFCompositeEntityId', () => {
  it('returns cfGuid:guid composite when cfGuid is present on entity', () => {
    expect(getCFCompositeEntityId(makeResource('org-a', 'cf-1'))).toBe('cf-1:org-a');
  });

  it('falls back to bare guid when cfGuid is missing (no throw)', () => {
    expect(getCFCompositeEntityId(makeResource('org-a'))).toBe('org-a');
  });

  it('falls back to bare guid when cfGuid is empty string', () => {
    const r = makeResource('org-a', '');
    expect(getCFCompositeEntityId(r)).toBe('org-a');
  });

  it('returns null-ish for missing metadata', () => {
    const broken = { entity: { cfGuid: 'cf-1' } } as unknown as APIResource;
    // metadata absent -> guid is null -> no composite possible -> return null/empty
    const out = getCFCompositeEntityId(broken);
    expect(out).toBeFalsy();
  });
});
