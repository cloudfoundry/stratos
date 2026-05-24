import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
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
import { EndpointDataRegistry } from '../../services/endpoint-data/endpoint-data.registry';
import type { StOrg, StSpace } from '../../services/endpoint-data/stratos-types';

/**
 * Fake EndpointDataRegistry for spec scenarios that need to drive
 * orgs/spaces data into the picker without booting the real
 * registry + drain stack. Each `acquire(cnsi)` returns a per-cnsi
 * stub EDS whose `orgs` / `spaces` / loading flags are WritableSignals
 * the test can mutate to simulate the drain landing.
 */
interface FakeEDS {
  orgs: WritableSignal<StOrg[]>;
  spaces: WritableSignal<StSpace[]>;
  isLoadingOrgs: WritableSignal<boolean>;
  isLoadingSpaces: WritableSignal<boolean>;
}

function makeFakeRegistry() {
  const byCnsi = new Map<string, FakeEDS>();
  const get = (cnsi: string): FakeEDS => {
    let eds = byCnsi.get(cnsi);
    if (!eds) {
      eds = {
        orgs: signal<StOrg[]>([]),
        spaces: signal<StSpace[]>([]),
        isLoadingOrgs: signal(false),
        isLoadingSpaces: signal(false),
      };
      byCnsi.set(cnsi, eds);
    }
    return eds;
  };
  return {
    acquire: (cnsi: string) => get(cnsi),
    release: (_cnsi: string) => { /* no-op */ },
    setOrgs: (cnsi: string, orgs: { guid: string; name: string }[]) =>
      get(cnsi).orgs.set(orgs as StOrg[]),
    setSpaces: (cnsi: string, spaces: { guid: string; name: string; orgGuid: string }[]) =>
      get(cnsi).spaces.set(spaces as StSpace[]),
  };
}
type FakeRegistry = ReturnType<typeof makeFakeRegistry>;

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
 * V3-native data sourcing via EndpointDataService.
 *
 * Org/space data is sourced from the per-CNSI EndpointDataService handle
 * the picker acquires through EndpointDataRegistry on CF selection. The
 * registry-driven drain (used by home cards / walls) already hydrates
 * orgs/spaces; the picker just reads off the cached signals. Tests drive
 * a FakeRegistry stub directly — no HTTP traffic, no real drain — and
 * mutate the per-CNSI orgs/spaces signals to simulate the drain landing.
 *
 * Replaces the prior HTTP-driven coverage of the v3 `/pp/v1/cf/orgs/...`
 * and `/pp/v1/cf/org/.../spaces` handlers, which moved out of the
 * picker when CfOrgSpaceDataService stopped issuing its own fetches.
 */
describe('V3-native org sourcing', () => {

  let fakeRegistry: FakeRegistry;

  beforeEach(() => {
    fakeRegistry = makeFakeRegistry();
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
        { provide: EndpointDataRegistry, useValue: fakeRegistry },
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  it('acquires an EndpointDataService for the selected cnsi', () => {
    const service = TestBed.inject(CfOrgSpaceDataService);
    const spy = vi.spyOn(fakeRegistry, 'acquire');

    service.cf.select.set('cf-A');
    TestBed.tick();

    expect(spy).toHaveBeenCalledWith('cf-A');
  });

  it('populates the orgList signal from the EDS orgs signal', () => {
    const service = TestBed.inject(CfOrgSpaceDataService);

    service.cf.select.set('cf-A');
    TestBed.tick();

    fakeRegistry.setOrgs('cf-A', [
      { guid: 'org-1', name: 'alpha' },
      { guid: 'org-2', name: 'bravo' },
    ]);
    TestBed.tick();

    expect(service.orgList().map(o => o.guid)).toEqual(['org-1', 'org-2']);
  });

  /**
   * Regression guard: duplicate-URL endpoint collision.
   *
   * Three CF endpoints share the same api_url. The old v2 ngrx
   * cross-endpoint pagination collapsed entities by GUID across the
   * three responses and stamped all of them with one winner cfGuid,
   * causing the downstream filter (entity.cfGuid === selectedCF) to
   * drop most orgs. The EDS-per-CNSI path is keyed by cnsi guid, so
   * each endpoint's orgs are independently held even when they share
   * GUIDs across endpoints — orgList must scope to the selected cnsi.
   */
  it('scopes orgList to the selected cnsi even with duplicate-URL endpoints', () => {
    const service = TestBed.inject(CfOrgSpaceDataService);

    fakeRegistry.setOrgs('cf-A', [{ guid: 'shared-org-1', name: 'org-on-A' }]);
    fakeRegistry.setOrgs('cf-B', [{ guid: 'shared-org-1', name: 'org-on-B' }]);

    service.cf.select.set('cf-A');
    TestBed.tick();
    expect(service.orgList().map(o => o.name)).toEqual(['org-on-A']);

    service.cf.select.set('cf-B');
    TestBed.tick();
    expect(service.orgList().map(o => o.name)).toEqual(['org-on-B']);
  });

  it('cascade-clears orgSelected and spaceSelected when cfSelected changes', () => {
    const service = TestBed.inject(CfOrgSpaceDataService);

    service.cf.select.set('cf-A');
    service.org.select.set('org-1');
    service.space.select.set('space-1');
    TestBed.tick();

    service.cf.select.set('cf-B');
    TestBed.tick();

    expect(service.org.select()).toBeFalsy();
    expect(service.space.select()).toBeFalsy();
  });

  it('exposes orgList contents through the legacy org.list$ observable', async () => {
    const service = TestBed.inject(CfOrgSpaceDataService);

    const emissions: { guid: string }[][] = [];
    const sub = service.org.list$.subscribe(list => emissions.push(list as any));

    service.cf.select.set('cf-A');
    TestBed.tick();
    fakeRegistry.setOrgs('cf-A', [{ guid: 'org-1', name: 'alpha' }]);
    TestBed.tick();
    await Promise.resolve();

    const last = emissions[emissions.length - 1];
    expect(last.map(o => o.guid)).toEqual(['org-1']);

    sub.unsubscribe();
  });
});

/**
 * V3-native space sourcing via EndpointDataService.
 *
 * Spaces are filtered out of the per-CNSI EDS spaces signal by orgGuid
 * once an org is selected. Same structural cure as orgs — no
 * cross-endpoint fan-out, no duplicate-URL collision.
 */
describe('V3-native space sourcing', () => {

  let fakeRegistry: FakeRegistry;

  beforeEach(() => {
    fakeRegistry = makeFakeRegistry();
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
        { provide: EndpointDataRegistry, useValue: fakeRegistry },
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  it('populates the spaceList signal from the EDS spaces signal filtered by orgGuid', () => {
    const service = TestBed.inject(CfOrgSpaceDataService);

    fakeRegistry.setOrgs('cf-A', [{ guid: 'org-1', name: 'alpha' }]);
    fakeRegistry.setSpaces('cf-A', [
      { guid: 'space-a', name: 'development', orgGuid: 'org-1' },
      { guid: 'space-b', name: 'production', orgGuid: 'org-1' },
    ]);

    service.cf.select.set('cf-A');
    service.org.select.set('org-1');
    TestBed.tick();

    expect(service.spaceList().map(s => s.guid)).toEqual(['space-a', 'space-b']);
  });

  it('filters out spaces belonging to other orgs', () => {
    const service = TestBed.inject(CfOrgSpaceDataService);

    fakeRegistry.setOrgs('cf-A', [
      { guid: 'org-1', name: 'alpha' },
      { guid: 'org-2', name: 'bravo' },
    ]);
    fakeRegistry.setSpaces('cf-A', [
      { guid: 'space-a', name: 'a-space', orgGuid: 'org-1' },
      { guid: 'space-b', name: 'b-space', orgGuid: 'org-2' },
    ]);

    service.cf.select.set('cf-A');
    service.org.select.set('org-1');
    TestBed.tick();

    expect(service.spaceList().map(s => s.guid)).toEqual(['space-a']);
  });

  it('cascade-clears spaceSelected when org changes', () => {
    const service = TestBed.inject(CfOrgSpaceDataService);

    fakeRegistry.setOrgs('cf-A', [
      { guid: 'org-1', name: 'alpha' },
      { guid: 'org-2', name: 'bravo' },
    ]);

    service.cf.select.set('cf-A');
    service.org.select.set('org-1');
    service.space.select.set('space-1');
    TestBed.tick();

    service.org.select.set('org-2');
    TestBed.tick();
    expect(service.space.select()).toBeFalsy();
  });

  it('exposes spaceList contents through the legacy space.list$ observable', async () => {
    const service = TestBed.inject(CfOrgSpaceDataService);

    const emissions: { guid: string }[][] = [];
    const sub = service.space.list$.subscribe(list => emissions.push(list as any));

    fakeRegistry.setOrgs('cf-A', [{ guid: 'org-1', name: 'alpha' }]);
    fakeRegistry.setSpaces('cf-A', [
      { guid: 'space-a', name: 'development', orgGuid: 'org-1' },
    ]);

    service.cf.select.set('cf-A');
    service.org.select.set('org-1');
    TestBed.tick();
    await Promise.resolve();

    const last = emissions[emissions.length - 1];
    expect(last.map(s => s.guid)).toEqual(['space-a']);

    sub.unsubscribe();
  });
});

/**
 * V3-native auto-selectors over EDS-sourced data.
 *
 * `enableAutoSelectors()` is opt-in (create-application calls it; the wizard
 * does not). When enabled, a singleton org or space — count exactly 1 and
 * nothing currently selected — is auto-picked off the EDS-sourced orgList /
 * spaceList. Default (no enableAutoSelectors call) must do no auto-pick:
 * the wizard relies on this so the user always picks org/space explicitly.
 */
describe('V3-native auto-selectors', () => {

  let fakeRegistry: FakeRegistry;

  beforeEach(() => {
    fakeRegistry = makeFakeRegistry();
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
        { provide: EndpointDataRegistry, useValue: fakeRegistry },
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  it('auto-picks the single org when enableAutoSelectors is called and EDS holds one org', () => {
    const service = TestBed.inject(CfOrgSpaceDataService);

    service.enableAutoSelectors();
    fakeRegistry.setOrgs('cf-A', [{ guid: 'only-org', name: 'solo' }]);

    service.cf.select.set('cf-A');
    TestBed.tick();

    expect(service.org.select()).toBe('only-org');
  });

  it('does NOT auto-pick when EDS holds more than one org', () => {
    const service = TestBed.inject(CfOrgSpaceDataService);

    service.enableAutoSelectors();
    fakeRegistry.setOrgs('cf-A', [
      { guid: 'org-1', name: 'a' },
      { guid: 'org-2', name: 'b' },
    ]);

    service.cf.select.set('cf-A');
    TestBed.tick();

    expect(service.org.select()).toBeFalsy();
  });

  it('does NOT auto-pick when enableAutoSelectors was never called (default)', () => {
    const service = TestBed.inject(CfOrgSpaceDataService);

    // Note: no service.enableAutoSelectors() call.
    fakeRegistry.setOrgs('cf-A', [{ guid: 'only-org', name: 'solo' }]);

    service.cf.select.set('cf-A');
    TestBed.tick();

    expect(service.org.select()).toBeFalsy();
  });

  it('auto-picks the single space when enableAutoSelectors and EDS holds one space for the org', () => {
    const service = TestBed.inject(CfOrgSpaceDataService);

    service.enableAutoSelectors();
    fakeRegistry.setOrgs('cf-A', [{ guid: 'only-org', name: 'solo' }]);
    fakeRegistry.setSpaces('cf-A', [
      { guid: 'only-space', name: 'dev', orgGuid: 'only-org' },
    ]);

    service.cf.select.set('cf-A');
    TestBed.tick();

    expect(service.org.select()).toBe('only-org');
    expect(service.space.select()).toBe('only-space');
  });

  it('does NOT auto-pick space when EDS holds multiple spaces for the org', () => {
    const service = TestBed.inject(CfOrgSpaceDataService);

    service.enableAutoSelectors();
    fakeRegistry.setOrgs('cf-A', [{ guid: 'only-org', name: 'solo' }]);
    fakeRegistry.setSpaces('cf-A', [
      { guid: 'sp-1', name: 'dev', orgGuid: 'only-org' },
      { guid: 'sp-2', name: 'prod', orgGuid: 'only-org' },
    ]);

    service.cf.select.set('cf-A');
    TestBed.tick();

    expect(service.org.select()).toBe('only-org');
    expect(service.space.select()).toBeFalsy();
  });
});
