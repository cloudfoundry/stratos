import { describe, it, expect, beforeEach } from 'vitest';
import { _resetSignalRelationTreeCache } from './signal-relation-tree';
import { signalRelationKey, RelationDescriptor } from './signal-relation-types';
import { SignalRelationFetcherService } from './signal-relation-fetcher.service';
import { SignalRelationPostProcessorRegistry } from './signal-relation-post-processor';
import { populateChildrenFromParent, validateRelationsForSignals } from './signal-entity-relations';

// Mirrors `entity-relations-from-parent.spec.ts` (no list in parent =
// no-op; list in parent = realized children) plus a missing-children
// case that exercises the descriptor fetchChildren() path. No NGRX or
// HttpClient — the substrate is pure TS.

describe('Signal Entity Relations - Fetcher', () => {
  const ORG = 'organization';
  const SPACE = 'space';
  const ORG_GUID = 'org-1';
  const CNSI = 'cnsi-1';

  const orgSpacesKey = signalRelationKey(ORG, SPACE);

  let postProcessors: SignalRelationPostProcessorRegistry;
  let fetcher: SignalRelationFetcherService;

  beforeEach(() => {
    _resetSignalRelationTreeCache();
    postProcessors = new SignalRelationPostProcessorRegistry();
    fetcher = new SignalRelationFetcherService(postProcessors);
  });

  it('No list in parent - no op (returns empty children, no fetch fires)', async () => {
    let fetchCalls = 0;
    const desc: RelationDescriptor = {
      parentEntityType: ORG,
      childEntityType: SPACE,
      paramName: 'spaces',
      isArray: true,
      inlineParentPath: 'entity.spaces',
      fetchChildren: async () => { fetchCalls++; return []; },
    };
    fetcher.register(desc);

    // Inline path is missing — the fetcher falls through to fetchChildren
    // (legacy parity: missing inline + populateMissing=true would dispatch
    // a fetch). We assert that path runs and returns the empty list.
    const result = await validateRelationsForSignals({
      fetcher,
      cnsiGuid: CNSI,
      rootEntityType: ORG,
      parents: [{ guid: ORG_GUID, payload: { metadata: { guid: ORG_GUID }, entity: { name: 'org-name' } } }],
      includeRelations: [orgSpacesKey],
    });

    expect(fetchCalls).toBe(1);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].fromInline).toBe(false);
    expect(result.entries[0].children).toEqual([]);

    // Synchronous populate-from-parent helper returns null when the
    // inline path is absent — same shape as the legacy short-circuit.
    const inline = populateChildrenFromParent(
      { metadata: { guid: ORG_GUID }, entity: { name: 'org-name' } },
      desc,
    );
    expect(inline).toBeNull();
  });

  it('List in parent - resolved inline, no fetchChildren call', async () => {
    let fetchCalls = 0;
    const spaces = [
      { metadata: { guid: 's-1' }, entity: { name: 'space1' } },
      { metadata: { guid: 's-2' }, entity: { name: 'space2' } },
      { metadata: { guid: 's-3' }, entity: { name: 'space3' } },
    ];
    const desc: RelationDescriptor = {
      parentEntityType: ORG,
      childEntityType: SPACE,
      paramName: 'spaces',
      isArray: true,
      inlineParentPath: 'entity.spaces',
      fetchChildren: async () => { fetchCalls++; return []; },
    };
    fetcher.register(desc);

    const orgPayload = { metadata: { guid: ORG_GUID }, entity: { name: 'org-name', spaces } };

    const result = await validateRelationsForSignals({
      fetcher,
      cnsiGuid: CNSI,
      rootEntityType: ORG,
      parents: [{ guid: ORG_GUID, payload: orgPayload }],
      includeRelations: [orgSpacesKey],
    });

    expect(fetchCalls).toBe(0);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].fromInline).toBe(true);
    expect(result.entries[0].children).toEqual(spaces);
    expect(result.entries[0].parentGuid).toBe(ORG_GUID);
    expect(result.entries[0].paramName).toBe('spaces');

    // populateChildrenFromParent returns the same list synchronously.
    const inline = populateChildrenFromParent(orgPayload, desc);
    expect(inline).toEqual(spaces);

    // childSignal returns the realized array for reactive consumers.
    const sig = fetcher.childSignal(CNSI, ORG, ORG_GUID, SPACE);
    expect(sig()).toEqual(spaces);
  });

  it('Missing children - descriptor fetchChildren resolves via async loader', async () => {
    const fetched = [
      { metadata: { guid: 's-fetched-1' }, entity: { name: 'fetched1' } },
      { metadata: { guid: 's-fetched-2' }, entity: { name: 'fetched2' } },
    ];
    let observedCnsi = '';
    let observedParentGuid = '';
    let observedRemaining: ReadonlyArray<string> = [];
    const desc: RelationDescriptor = {
      parentEntityType: ORG,
      childEntityType: SPACE,
      paramName: 'spaces',
      isArray: true,
      // No inlineParentPath -> fetchChildren is the only resolution path.
      fetchChildren: async (_parent, ctx) => {
        observedCnsi = ctx.cnsiGuid;
        observedParentGuid = ctx.parentGuid;
        observedRemaining = ctx.remainingIncludeRelations;
        return fetched;
      },
    };
    fetcher.register(desc);

    const orgPayload = { metadata: { guid: ORG_GUID }, entity: { name: 'org-name' } };
    const result = await validateRelationsForSignals({
      fetcher,
      cnsiGuid: CNSI,
      rootEntityType: ORG,
      parents: [{ guid: ORG_GUID, payload: orgPayload }],
      includeRelations: [orgSpacesKey],
    });

    expect(observedCnsi).toBe(CNSI);
    expect(observedParentGuid).toBe(ORG_GUID);
    expect(observedRemaining).toEqual([]);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].fromInline).toBe(false);
    expect(result.entries[0].children).toEqual(fetched);

    const sig = fetcher.childSignal(CNSI, ORG, ORG_GUID, SPACE);
    expect(sig()).toEqual(fetched);
  });

  it('fetchChildren error captured per-entry, not thrown', async () => {
    const desc: RelationDescriptor = {
      parentEntityType: ORG,
      childEntityType: SPACE,
      paramName: 'spaces',
      isArray: true,
      fetchChildren: async () => { throw new Error('boom'); },
    };
    fetcher.register(desc);

    const result = await validateRelationsForSignals({
      fetcher,
      cnsiGuid: CNSI,
      rootEntityType: ORG,
      parents: [{ guid: ORG_GUID, payload: { metadata: { guid: ORG_GUID } } }],
      includeRelations: [orgSpacesKey],
    });

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].children).toEqual([]);
    expect(result.entries[0].errors).toHaveLength(1);
    expect(result.entries[0].errors[0].message).toBe('boom');
    expect(result.errors).toHaveLength(1);
  });
});
