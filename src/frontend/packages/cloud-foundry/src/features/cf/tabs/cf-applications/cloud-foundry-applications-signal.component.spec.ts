import { describe, expect, it } from 'vitest';

import { CloudFoundryApplicationsSignalComponent as Cmp } from './cloud-foundry-applications-signal.component';
import type { StApp } from '../../../../services/endpoint-data/stratos-types';

// The per-CF Applications tab shows an Org/Space compound column — the
// application wall's CF/Org/Space column minus the CF (endpoint) segment,
// since the CF is already implied by the route. These cover the pure
// resolution/rendering helpers that back that column.

const EMPTY = new Map<string, string>();

function app(overrides: Partial<StApp> = {}): StApp {
  return {
    cnsiGuid: 'cnsi-1',
    guid: 'app-1',
    name: 'my-app',
    state: 'STARTED',
    spaceGuid: 'space-1',
    instances: 1,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  } as StApp;
}

describe('CloudFoundryApplicationsSignalComponent.resolveOrgSpace', () => {
  it('prefers the names carried on the row (server-side join)', () => {
    const r = Cmp.resolveOrgSpace(app({ orgName: 'my-org', spaceName: 'my-space' }), EMPTY, EMPTY);
    expect(r).toEqual({ orgName: 'my-org', spaceName: 'my-space' });
  });

  it('falls back to the catalog name maps by guid when the row lacks names', () => {
    const orgNames = new Map([['org-1', 'Cat Org']]);
    const spaceNames = new Map([['space-1', 'Cat Space']]);
    const r = Cmp.resolveOrgSpace(app({ orgGuid: 'org-1', spaceGuid: 'space-1' }), orgNames, spaceNames);
    expect(r).toEqual({ orgName: 'Cat Org', spaceName: 'Cat Space' });
  });

  it('uses an em-dash when neither the row nor the catalog has a name', () => {
    const r = Cmp.resolveOrgSpace(app({ orgGuid: 'org-x', spaceGuid: 'space-x' }), EMPTY, EMPTY);
    expect(r).toEqual({ orgName: '—', spaceName: '—' });
  });

  it('uses an em-dash for a missing org guid', () => {
    const r = Cmp.resolveOrgSpace(app({ orgGuid: undefined, spaceName: 'my-space' }), EMPTY, EMPTY);
    expect(r.orgName).toBe('—');
  });
});

describe('CloudFoundryApplicationsSignalComponent.renderOrgSpace', () => {
  it('renders "org / space" for sort/filter flattening', () => {
    expect(Cmp.renderOrgSpace(app({ orgName: 'o', spaceName: 's' }), EMPTY, EMPTY)).toBe('o / s');
  });
});

describe('CloudFoundryApplicationsSignalComponent.compoundOrgSpace', () => {
  it('returns exactly two segments — org then space — with NO CF segment', () => {
    const segs = Cmp.compoundOrgSpace(
      app({ orgGuid: 'org-1', orgName: 'my-org', spaceName: 'my-space' }), EMPTY, EMPTY);
    expect(segs.map(s => s.text)).toEqual(['my-org', 'my-space']);
    expect(segs.length).toBe(2);
  });

  it('links org and space to their CF detail pages once names resolve', () => {
    const segs = Cmp.compoundOrgSpace(
      app({ cnsiGuid: 'cnsi-1', orgGuid: 'org-1', spaceGuid: 'space-1', orgName: 'o', spaceName: 's' }),
      EMPTY, EMPTY);
    expect(segs[0].link).toEqual(['/cloud-foundry', 'cnsi-1', 'organizations', 'org-1']);
    expect(segs[1].link).toEqual(['/cloud-foundry', 'cnsi-1', 'organizations', 'org-1', 'spaces', 'space-1']);
  });

  it('renders unresolved segments as plain text (no dead links)', () => {
    const segs = Cmp.compoundOrgSpace(app({ orgGuid: 'org-x', spaceGuid: 'space-x' }), EMPTY, EMPTY);
    expect(segs[0]).toEqual({ text: '—', link: undefined });
    expect(segs[1]).toEqual({ text: '—', link: undefined });
  });

  it('does not link the space when the org guid is unknown', () => {
    // Space link needs the org guid in its path, so without it the space is plain text.
    const segs = Cmp.compoundOrgSpace(
      app({ orgGuid: undefined, spaceGuid: 'space-1', spaceName: 's' }), EMPTY, EMPTY);
    expect(segs[1].link).toBeUndefined();
  });
});
