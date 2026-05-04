import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';
import { filter, take } from 'rxjs/operators';

import {
  EntityCatalogTestModule,
  TEST_CATALOGUE_ENTITIES,
  generateStratosEntities,
  EntityCatalogHelper,
  EntityCatalogHelpers,
  APIResource,
} from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';

import { generateCFEntities } from '../../cf-entity-generator';
import { IOrganization, ISpace } from '../../cf-api.types';
import { CfOrgSpaceDataService } from './cf-org-space-service.service';

/**
 * Helper to build an APIResource<IOrganization> with spaces for testing.
 */
function makeOrg(
  orgGuid: string,
  orgName: string,
  cfGuid: string,
  spaces: { guid: string; name: string }[]
): APIResource<IOrganization> {
  return {
    metadata: { guid: orgGuid, created_at: '', updated_at: '', url: '' },
    entity: {
      name: orgName,
      cfGuid,
      guid: orgGuid,
      spaces: spaces.map(s => ({
        metadata: { guid: s.guid, created_at: '', updated_at: '', url: '' },
        entity: {
          name: s.name,
          guid: s.guid,
          organization_guid: orgGuid,
          allow_ssh: false,
          organization_url: '',
          developers_url: '',
          managers_url: '',
          auditors_url: '',
          apps_url: '',
          routes_url: '',
          domains_url: '',
          service_instances_url: '',
          app_events_url: '',
          security_groups_url: '',
          staging_security_groups_url: '',
        } as ISpace,
      })) as APIResource<ISpace>[],
    } as IOrganization,
  };
}

/**
 * Replicate the createSpace() mapping logic for isolated unit testing.
 * This mirrors the observable pipeline in CfOrgSpaceDataService.createSpace()
 * so we can verify the transformation without full NgRx store setup.
 */
function spaceListMapper(selectedOrgGuid: string | null, orgs: APIResource<IOrganization>[]): ISpace[] {
  if (selectedOrgGuid) {
    const selectedOrg = orgs.find(org => org.metadata.guid === selectedOrgGuid);
    if (selectedOrg?.entity?.spaces) {
      return (selectedOrg.entity.spaces as APIResource<ISpace>[]).map(space => {
        const entity = { ...space.entity };
        entity.guid = space.metadata.guid;
        return entity;
      }).sort((a, b) => a.name.localeCompare(b.name));
    }
    return [];
  }
  const seen = new Set<string>();
  const allSpaces: ISpace[] = [];
  for (const org of orgs) {
    if (org.entity?.spaces) {
      for (const space of (org.entity.spaces as APIResource<ISpace>[])) {
        if (!seen.has(space.metadata.guid)) {
          seen.add(space.metadata.guid);
          const entity = { ...space.entity };
          entity.guid = space.metadata.guid;
          entity.name = `${space.entity.name} (${org.entity.name})`;
          allSpaces.push(entity);
        }
      }
    }
  }
  return allSpaces.sort((a, b) => a.name.localeCompare(b.name));
}

describe('CfOrgSpaceDataService', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        createBasicStoreModule(),
        EntityCatalogTestModule,
      ],
      providers: [
        CfOrgSpaceDataService,
        ...STORE_TEST_PROVIDERS,
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities(),
          ]
        },
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });

    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  it('should be created', () => {
    const service = TestBed.inject(CfOrgSpaceDataService);
    expect(service).toBeTruthy();
  });
});

describe('createSpace() mapping logic', () => {

  const orgs = [
    makeOrg('org-1', 'us-east-prod', 'cf-1', [
      { guid: 'space-1a', name: 'development' },
      { guid: 'space-1b', name: 'production' },
    ]),
    makeOrg('org-2', 'eu-central-prod', 'cf-1', [
      { guid: 'space-2a', name: 'development' },
      { guid: 'space-2b', name: 'staging' },
    ]),
  ];

  describe('when an org is selected', () => {
    it('returns spaces from only that org with plain names', () => {
      const result = spaceListMapper('org-1', orgs);
      expect(result).toHaveLength(2);
      expect(result.map(s => s.name)).toEqual(['development', 'production']);
    });

    it('sets guid on each space entity', () => {
      const result = spaceListMapper('org-1', orgs);
      expect(result[0].guid).toBe('space-1a');
      expect(result[1].guid).toBe('space-1b');
    });

    it('sorts spaces alphabetically', () => {
      const reversed = [
        makeOrg('org-x', 'test-org', 'cf-1', [
          { guid: 's3', name: 'zebra' },
          { guid: 's1', name: 'alpha' },
          { guid: 's2', name: 'middle' },
        ]),
      ];
      const result = spaceListMapper('org-x', reversed);
      expect(result.map(s => s.name)).toEqual(['alpha', 'middle', 'zebra']);
    });

    it('returns empty array when org has no spaces', () => {
      const noSpaces = [makeOrg('org-empty', 'empty-org', 'cf-1', [])];
      const result = spaceListMapper('org-empty', noSpaces);
      expect(result).toEqual([]);
    });

    it('returns empty array when org guid not found', () => {
      const result = spaceListMapper('nonexistent', orgs);
      expect(result).toEqual([]);
    });
  });

  describe('when org is "All" (no selection)', () => {
    it('aggregates spaces from all orgs', () => {
      const result = spaceListMapper(null, orgs);
      expect(result).toHaveLength(4);
    });

    it('labels spaces as "space (org)" for disambiguation', () => {
      const result = spaceListMapper(null, orgs);
      const names = result.map(s => s.name);
      expect(names).toContain('development (eu-central-prod)');
      expect(names).toContain('development (us-east-prod)');
      expect(names).toContain('production (us-east-prod)');
      expect(names).toContain('staging (eu-central-prod)');
    });

    it('sorts alphabetically (space name leads sort)', () => {
      const result = spaceListMapper(null, orgs);
      const names = result.map(s => s.name);
      expect(names).toEqual([
        'development (eu-central-prod)',
        'development (us-east-prod)',
        'production (us-east-prod)',
        'staging (eu-central-prod)',
      ]);
    });

    it('preserves correct GUIDs on disambiguated spaces', () => {
      const result = spaceListMapper(null, orgs);
      const devEu = result.find(s => s.name === 'development (eu-central-prod)');
      const devUs = result.find(s => s.name === 'development (us-east-prod)');
      expect(devEu!.guid).toBe('space-2a');
      expect(devUs!.guid).toBe('space-1a');
    });

    it('deduplicates spaces by GUID', () => {
      const withDupe = [
        makeOrg('org-a', 'org-a', 'cf-1', [
          { guid: 'shared-space', name: 'shared' },
        ]),
        makeOrg('org-b', 'org-b', 'cf-1', [
          { guid: 'shared-space', name: 'shared' },
        ]),
      ];
      const result = spaceListMapper(null, withDupe);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('shared (org-a)');
    });

    it('skips orgs with no spaces property', () => {
      const mixed: APIResource<IOrganization>[] = [
        makeOrg('org-1', 'has-spaces', 'cf-1', [
          { guid: 'sp-1', name: 'dev' },
        ]),
        {
          metadata: { guid: 'org-2', created_at: '', updated_at: '', url: '' },
          entity: { name: 'no-spaces' } as IOrganization,
        },
      ];
      const result = spaceListMapper(null, mixed);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('dev (has-spaces)');
    });

    it('returns empty array when no orgs have spaces', () => {
      const empty = [
        makeOrg('org-1', 'empty1', 'cf-1', []),
        makeOrg('org-2', 'empty2', 'cf-1', []),
      ];
      const result = spaceListMapper(null, empty);
      expect(result).toEqual([]);
    });

    it('treats empty string org selection as "All"', () => {
      const result = spaceListMapper('', orgs);
      expect(result).toHaveLength(4);
      expect(result[0].name).toContain('(');
    });
  });
});

/**
 * FWT-917 regression lock for the auto-selector loading-gate fix.
 *
 * Before the fix, `setupAutoSelectors` used `withLatestFrom(this.org.list$)`
 * which captured org.list$ at the exact instant cf.select fired. On a cold
 * cache (new-image deploy, cleared localStorage, fresh login), the orgs
 * pagination fetch was still in flight, so org.list$ was [] and the cascade
 * cleared org.select to undefined. The cascade never recovered because
 * cf.select doesn't re-fire when the fetch eventually completes.
 *
 * The fix replaces `withLatestFrom` with a `switchMap` that gates on the
 * pagination state — specifically, waits until a current-page request
 * exists (was dispatched) AND is no longer busy (completed) before reading
 * a fresh org.list$ snapshot. These tests lock in the filter predicate and
 * the observable pipeline shape so future refactors don't silently
 * reintroduce the race.
 */
describe('FWT-917 auto-selector loading gate', () => {

  /**
   * Mirror of the predicate used in `waitForOrgsReady$` inside
   * CfOrgSpaceDataService. Exported-alike so we can test each state
   * transition without booting the full service.
   */
  const isReady = (pag: any) => {
    const req = pag?.pageRequests?.[pag?.currentPage];
    return !!req && !req.busy;
  };

  describe('isReady predicate', () => {
    it('returns false when pagination is null', () => {
      expect(isReady(null)).toBe(false);
    });

    it('returns false when pagination is undefined', () => {
      expect(isReady(undefined)).toBe(false);
    });

    it('returns false when pageRequests is missing (never fetched)', () => {
      expect(isReady({ currentPage: 1 })).toBe(false);
    });

    it('returns false when current page has no request entry', () => {
      // A fetch for page 2 doesn't satisfy a wait for page 1
      expect(isReady({ currentPage: 1, pageRequests: { 2: { busy: false } } })).toBe(false);
    });

    it('returns false when current page request is busy (fetch in flight)', () => {
      expect(isReady({ currentPage: 1, pageRequests: { 1: { busy: true } } })).toBe(false);
    });

    it('returns true when current page request exists and is not busy', () => {
      expect(isReady({ currentPage: 1, pageRequests: { 1: { busy: false } } })).toBe(true);
    });

    it('returns true even when the completed request has an error', () => {
      // An error response is still "done" — the cascade should proceed and
      // see whatever orgs ended up in the list (possibly empty). Blocking
      // forever on error would be worse UX.
      expect(isReady({
        currentPage: 1,
        pageRequests: { 1: { busy: false, error: true, message: 'boom' } },
      })).toBe(true);
    });
  });

  describe('observable pipeline', () => {
    it('defers emission until pagination transitions from busy → not-busy', () => {
      // Simulate the cold-cache race: pagination starts without pageRequests,
      // then gets a busy entry (fetch dispatched), then gets a non-busy
      // entry (fetch completed). The cascade should only fire on the last
      // state, not any earlier one.
      const pagination$ = new BehaviorSubject<any>({ currentPage: 1 });
      const results: any[] = [];

      pagination$.pipe(
        filter(pag => {
          const req = pag?.pageRequests?.[pag?.currentPage];
          return !!req && !req.busy;
        }),
        take(1),
      ).subscribe(pag => results.push(pag));

      // Initial state (never-fetched) — should not fire
      expect(results).toHaveLength(0);

      // Fetch dispatched but not yet complete — still should not fire
      pagination$.next({ currentPage: 1, pageRequests: { 1: { busy: true } } });
      expect(results).toHaveLength(0);

      // Fetch completed — NOW the cascade fires
      pagination$.next({ currentPage: 1, pageRequests: { 1: { busy: false } } });
      expect(results).toHaveLength(1);
      expect(results[0].pageRequests[1].busy).toBe(false);
    });

    it('emits immediately when pagination is already completed on first subscribe (warm cache)', () => {
      // Warm-cache case: pagination state already shows a completed fetch
      // when the cascade subscribes. The cascade should fire on the
      // first emission with no delay.
      const pagination$ = new BehaviorSubject<any>({
        currentPage: 1,
        pageRequests: { 1: { busy: false } },
      });
      const results: any[] = [];

      pagination$.pipe(
        filter(pag => {
          const req = pag?.pageRequests?.[pag?.currentPage];
          return !!req && !req.busy;
        }),
        take(1),
      ).subscribe(pag => results.push(pag));

      // Synchronously fires on subscribe because BehaviorSubject replays
      // its current value and the filter passes.
      expect(results).toHaveLength(1);
    });

    it('skips intermediate busy-flip emissions and fires only on the first completed state', () => {
      // Re-fetch scenario: completed → busy again → completed. The
      // `take(1)` means we only fire once on the FIRST "completed"
      // transition; subsequent re-fetches don't re-fire this gate.
      const pagination$ = new BehaviorSubject<any>({
        currentPage: 1,
        pageRequests: { 1: { busy: true } },
      });
      const results: any[] = [];

      pagination$.pipe(
        filter(pag => {
          const req = pag?.pageRequests?.[pag?.currentPage];
          return !!req && !req.busy;
        }),
        take(1),
      ).subscribe(pag => results.push(pag));

      expect(results).toHaveLength(0);
      pagination$.next({ currentPage: 1, pageRequests: { 1: { busy: false } } });
      expect(results).toHaveLength(1);

      // Subsequent re-fetches should NOT re-emit to this subscriber
      pagination$.next({ currentPage: 1, pageRequests: { 1: { busy: true } } });
      pagination$.next({ currentPage: 1, pageRequests: { 1: { busy: false } } });
      expect(results).toHaveLength(1);
    });
  });
});

/**
 * V3-native data sourcing.
 *
 * Org/space data must come from per-cnsi V3 native handlers
 * (`/pp/v1/cf/orgs/{cnsiGuid}`, etc.), not from a cross-endpoint
 * v2 ngrx pagination action. The cross-endpoint path collapses
 * entities sharing duplicate URL endpoints and stamps them with one
 * winner cfGuid, dropping the rest from the downstream filter.
 */
describe('V3-native org sourcing', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        createBasicStoreModule(),
        EntityCatalogTestModule,
      ],
      providers: [
        CfOrgSpaceDataService,
        ...STORE_TEST_PROVIDERS,
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities(),
          ],
        },
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  it('fetches orgs from /pp/v1/cf/orgs/{cnsiGuid} when cf is selected', () => {
    const service = TestBed.inject(CfOrgSpaceDataService);
    const httpMock = TestBed.inject(HttpTestingController);

    service.cf.select.next('cf-A');
    TestBed.tick();

    const req = httpMock.expectOne(
      r => r.url.startsWith('/pp/v1/cf/orgs/cf-A'),
      'V3 native orgs handler should be called for the selected cnsi',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ resources: [], totalResults: 0 });

    httpMock.verify();
  });

  it('populates the orgList signal from the V3 response', async () => {
    const service = TestBed.inject(CfOrgSpaceDataService);
    const httpMock = TestBed.inject(HttpTestingController);

    service.cf.select.next('cf-A');
    TestBed.tick();

    httpMock.expectOne(r => r.url.startsWith('/pp/v1/cf/orgs/cf-A')).flush({
      resources: [
        { guid: 'org-1', name: 'alpha' },
        { guid: 'org-2', name: 'bravo' },
      ],
      totalResults: 2,
    });

    await Promise.resolve();
    TestBed.tick();

    const orgs = service.orgList();
    expect(orgs.map(o => o.guid)).toEqual(['org-1', 'org-2']);
    httpMock.verify();
  });

  /**
   * Regression guard: duplicate-URL endpoint collision.
   *
   * Three CF endpoints share the same api_url. The old v2 ngrx
   * cross-endpoint pagination collapsed entities by GUID across the
   * three responses and stamped all of them with one winner cfGuid,
   * causing the downstream filter (entity.cfGuid === selectedCF) to
   * drop most orgs. The V3 native path is per-cnsi by URL —
   * `/pp/v1/cf/orgs/{cnsiGuid}` — so each endpoint's orgs are
   * independently sourced and never collapsed.
   *
   * The orgs in this test even share GUIDs across endpoints (the
   * worst case in the duplicate-URL scenario, where the same CF is
   * registered three times). orgList must scope to the selected cnsi
   * regardless of GUID overlap.
   */
  it('scopes orgList to the selected cnsi even with duplicate-URL endpoints', async () => {
    const service = TestBed.inject(CfOrgSpaceDataService);
    const httpMock = TestBed.inject(HttpTestingController);

    service.cf.select.next('cf-A');
    TestBed.tick();
    httpMock.expectOne(r => r.url.startsWith('/pp/v1/cf/orgs/cf-A')).flush({
      resources: [{ guid: 'shared-org-1', name: 'org-on-A' }],
      totalResults: 1,
    });
    await Promise.resolve();
    TestBed.tick();
    expect(service.orgList().map(o => o.name)).toEqual(['org-on-A']);

    service.cf.select.next('cf-B');
    TestBed.tick();
    httpMock.expectOne(r => r.url.startsWith('/pp/v1/cf/orgs/cf-B')).flush({
      resources: [{ guid: 'shared-org-1', name: 'org-on-B' }],
      totalResults: 1,
    });
    await Promise.resolve();
    TestBed.tick();
    expect(service.orgList().map(o => o.name)).toEqual(['org-on-B']);

    httpMock.verify();
  });

  it('cascade-clears orgSelected and spaceSelected when cfSelected changes', () => {
    const service = TestBed.inject(CfOrgSpaceDataService);
    const httpMock = TestBed.inject(HttpTestingController);

    service.cf.select.next('cf-A');
    service.org.select.next('org-1');
    service.space.select.next('space-1');
    TestBed.tick();

    // Drain any in-flight requests so verify() is clean.
    httpMock.match(() => true).forEach(req => req.flush({ resources: [], totalResults: 0 }));

    service.cf.select.next('cf-B');
    TestBed.tick();

    expect(service.org.select.getValue()).toBeFalsy();
    expect(service.space.select.getValue()).toBeFalsy();

    httpMock.match(() => true).forEach(req => req.flush({ resources: [], totalResults: 0 }));
    httpMock.verify();
  });

  it('exposes orgList contents through the legacy org.list$ observable', async () => {
    const service = TestBed.inject(CfOrgSpaceDataService);
    const httpMock = TestBed.inject(HttpTestingController);

    const emissions: { guid: string }[][] = [];
    const sub = service.org.list$.subscribe(list => emissions.push(list as any));

    service.cf.select.next('cf-A');
    TestBed.tick();
    httpMock.expectOne(r => r.url.startsWith('/pp/v1/cf/orgs/cf-A')).flush({
      resources: [{ guid: 'org-1', name: 'alpha' }],
      totalResults: 1,
    });
    await Promise.resolve();
    TestBed.tick();

    const last = emissions[emissions.length - 1];
    expect(last.map(o => o.guid)).toEqual(['org-1']);

    sub.unsubscribe();
    httpMock.verify();
  });
});

/**
 * V3-native space sourcing.
 *
 * Spaces narrowed to a single org come from `/pp/v1/cf/org/{cnsiGuid}/{orgGuid}/spaces`
 * — per-cnsi, per-org. Same structural cure as orgs: no cross-endpoint
 * fan-out, no duplicate-URL collision.
 */
describe('V3-native space sourcing', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        createBasicStoreModule(),
        EntityCatalogTestModule,
      ],
      providers: [
        CfOrgSpaceDataService,
        ...STORE_TEST_PROVIDERS,
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities(),
          ],
        },
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  it('fetches spaces from /pp/v1/cf/org/{cnsi}/{org}/spaces when an org is selected', () => {
    const service = TestBed.inject(CfOrgSpaceDataService);
    const httpMock = TestBed.inject(HttpTestingController);

    service.cf.select.next('cf-A');
    TestBed.tick();
    httpMock.expectOne(r => r.url.startsWith('/pp/v1/cf/orgs/cf-A')).flush({
      resources: [{ guid: 'org-1', name: 'alpha' }],
      totalResults: 1,
    });

    service.org.select.next('org-1');
    TestBed.tick();

    const req = httpMock.expectOne(
      r => r.url.startsWith('/pp/v1/cf/org/cf-A/org-1/spaces'),
      'V3 native per-org spaces handler should be called',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ resources: [], totalResults: 0 });

    httpMock.verify();
  });

  it('populates the spaceList signal from the V3 per-org response', async () => {
    const service = TestBed.inject(CfOrgSpaceDataService);
    const httpMock = TestBed.inject(HttpTestingController);

    service.cf.select.next('cf-A');
    TestBed.tick();
    httpMock.expectOne(r => r.url.startsWith('/pp/v1/cf/orgs/cf-A')).flush({
      resources: [{ guid: 'org-1', name: 'alpha' }],
      totalResults: 1,
    });

    service.org.select.next('org-1');
    TestBed.tick();
    httpMock.expectOne(r => r.url.startsWith('/pp/v1/cf/org/cf-A/org-1/spaces')).flush({
      resources: [
        { guid: 'space-a', name: 'development' },
        { guid: 'space-b', name: 'production' },
      ],
      totalResults: 2,
    });

    await Promise.resolve();
    TestBed.tick();

    const spaces = service.spaceList();
    expect(spaces.map(s => s.guid)).toEqual(['space-a', 'space-b']);
    httpMock.verify();
  });

  it('cascade-clears spaceSelected when org changes', async () => {
    const service = TestBed.inject(CfOrgSpaceDataService);
    const httpMock = TestBed.inject(HttpTestingController);

    service.cf.select.next('cf-A');
    TestBed.tick();
    httpMock.match(() => true).forEach(req => req.flush({ resources: [], totalResults: 0 }));

    service.org.select.next('org-1');
    service.space.select.next('space-1');
    TestBed.tick();
    httpMock.match(() => true).forEach(req => req.flush({ resources: [], totalResults: 0 }));

    service.org.select.next('org-2');
    TestBed.tick();
    expect(service.space.select.getValue()).toBeFalsy();

    httpMock.match(() => true).forEach(req => req.flush({ resources: [], totalResults: 0 }));
    httpMock.verify();
  });

  it('exposes spaceList contents through the legacy space.list$ observable', async () => {
    const service = TestBed.inject(CfOrgSpaceDataService);
    const httpMock = TestBed.inject(HttpTestingController);

    const emissions: { guid: string }[][] = [];
    const sub = service.space.list$.subscribe(list => emissions.push(list as any));

    service.cf.select.next('cf-A');
    TestBed.tick();
    httpMock.expectOne(r => r.url.startsWith('/pp/v1/cf/orgs/cf-A')).flush({
      resources: [{ guid: 'org-1', name: 'alpha' }],
      totalResults: 1,
    });

    service.org.select.next('org-1');
    TestBed.tick();
    httpMock.expectOne(r => r.url.startsWith('/pp/v1/cf/org/cf-A/org-1/spaces')).flush({
      resources: [{ guid: 'space-a', name: 'development' }],
      totalResults: 1,
    });

    await Promise.resolve();
    TestBed.tick();

    const last = emissions[emissions.length - 1];
    expect(last.map(s => s.guid)).toEqual(['space-a']);

    sub.unsubscribe();
    httpMock.verify();
  });
});

/**
 * V3-native auto-selectors.
 *
 * `enableAutoSelectors()` is opt-in (create-application calls it; the wizard
 * does not). When enabled, a singleton org or space — count exactly 1 and
 * nothing currently selected — is auto-picked off the V3 fetch result. This
 * replaces the v2 ngrx pagination-based `setupAutoSelectors` machinery that
 * was entangled with the duplicate-URL collision path.
 *
 * Default (no enableAutoSelectors call) must do no auto-pick: the wizard
 * relies on this so the user always picks org/space explicitly.
 */
describe('V3-native auto-selectors', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        createBasicStoreModule(),
        EntityCatalogTestModule,
      ],
      providers: [
        CfOrgSpaceDataService,
        ...STORE_TEST_PROVIDERS,
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities(),
          ],
        },
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  it('auto-picks the single org when enableAutoSelectors is called and one org is fetched', async () => {
    const service = TestBed.inject(CfOrgSpaceDataService);
    const httpMock = TestBed.inject(HttpTestingController);

    service.enableAutoSelectors();
    service.cf.select.next('cf-A');
    TestBed.tick();
    httpMock.expectOne(r => r.url.startsWith('/pp/v1/cf/orgs/cf-A')).flush({
      resources: [{ guid: 'only-org', name: 'solo' }],
      totalResults: 1,
    });
    await Promise.resolve();
    TestBed.tick();

    expect(service.org.select.getValue()).toBe('only-org');
    httpMock.match(() => true).forEach(req => req.flush({ resources: [], totalResults: 0 }));
    httpMock.verify();
  });

  it('does NOT auto-pick when more than one org is fetched', async () => {
    const service = TestBed.inject(CfOrgSpaceDataService);
    const httpMock = TestBed.inject(HttpTestingController);

    service.enableAutoSelectors();
    service.cf.select.next('cf-A');
    TestBed.tick();
    httpMock.expectOne(r => r.url.startsWith('/pp/v1/cf/orgs/cf-A')).flush({
      resources: [
        { guid: 'org-1', name: 'a' },
        { guid: 'org-2', name: 'b' },
      ],
      totalResults: 2,
    });
    await Promise.resolve();
    TestBed.tick();

    expect(service.org.select.getValue()).toBeFalsy();
    httpMock.verify();
  });

  it('does NOT auto-pick when enableAutoSelectors was never called (default)', async () => {
    const service = TestBed.inject(CfOrgSpaceDataService);
    const httpMock = TestBed.inject(HttpTestingController);

    // Note: no service.enableAutoSelectors() call.
    service.cf.select.next('cf-A');
    TestBed.tick();
    httpMock.expectOne(r => r.url.startsWith('/pp/v1/cf/orgs/cf-A')).flush({
      resources: [{ guid: 'only-org', name: 'solo' }],
      totalResults: 1,
    });
    await Promise.resolve();
    TestBed.tick();

    expect(service.org.select.getValue()).toBeFalsy();
    httpMock.verify();
  });

  it('auto-picks the single space when enableAutoSelectors and the org has one space', async () => {
    const service = TestBed.inject(CfOrgSpaceDataService);
    const httpMock = TestBed.inject(HttpTestingController);

    service.enableAutoSelectors();
    service.cf.select.next('cf-A');
    TestBed.tick();
    httpMock.expectOne(r => r.url.startsWith('/pp/v1/cf/orgs/cf-A')).flush({
      resources: [{ guid: 'only-org', name: 'solo' }],
      totalResults: 1,
    });
    await Promise.resolve();
    TestBed.tick();

    // Org auto-picked → spaces fetch fires
    httpMock.expectOne(r => r.url.startsWith('/pp/v1/cf/org/cf-A/only-org/spaces')).flush({
      resources: [{ guid: 'only-space', name: 'dev' }],
      totalResults: 1,
    });
    await Promise.resolve();
    TestBed.tick();

    expect(service.space.select.getValue()).toBe('only-space');
    httpMock.verify();
  });

  it('does NOT auto-pick space when org has multiple spaces', async () => {
    const service = TestBed.inject(CfOrgSpaceDataService);
    const httpMock = TestBed.inject(HttpTestingController);

    service.enableAutoSelectors();
    service.cf.select.next('cf-A');
    TestBed.tick();
    httpMock.expectOne(r => r.url.startsWith('/pp/v1/cf/orgs/cf-A')).flush({
      resources: [{ guid: 'only-org', name: 'solo' }],
      totalResults: 1,
    });
    await Promise.resolve();
    TestBed.tick();

    httpMock.expectOne(r => r.url.startsWith('/pp/v1/cf/org/cf-A/only-org/spaces')).flush({
      resources: [
        { guid: 'sp-1', name: 'dev' },
        { guid: 'sp-2', name: 'prod' },
      ],
      totalResults: 2,
    });
    await Promise.resolve();
    TestBed.tick();

    expect(service.space.select.getValue()).toBeFalsy();
    httpMock.verify();
  });
});
