import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CurrentUserPermissionsService, TabNavService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cloud-foundry-endpoint-service.helper';

import {
  CloudFoundryApplicationsSignalComponent,
  CloudFoundryApplicationsSignalComponent as Cmp,
} from './cloud-foundry-applications-signal.component';
import { CfAppsSignalConfigService } from '../../../../shared/signal-list-configs/app/cf-apps-signal-config.service';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
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

// The per-CF Applications tab keeps its OWN lazy org/space catalog (rather
// than the shared EndpointDataService the other per-CF tabs read), so its
// toolbar dropdowns only populate once ensureNamesLoaded() runs. These cover
// the component wiring that triggers that fetch on first dropdown open.
function makeStubAppsConfig() {
  const allOption = { label: 'All', value: null };
  const view = {
    pagedItems: signal([]).asReadonly(),
    totalFilteredResults: signal(0).asReadonly(),
    totalPages: signal(1).asReadonly(),
    totalItems: signal(0).asReadonly(),
  };
  const orchestrator = {
    isAnyLoading: signal(false).asReadonly(),
    errorsByCnsi: signal(new Map<string, unknown>()).asReadonly(),
  };
  return {
    initialize: vi.fn(),
    clearLockedSpace: vi.fn(),
    ensureNamesLoaded: vi.fn().mockResolvedValue(undefined),
    loadAll: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockResolvedValue(undefined),
    deleteApp: vi.fn().mockResolvedValue(undefined),
    startStatsPolling: vi.fn(),
    clearFilters: vi.fn(),
    registerSortExtractor: vi.fn(),
    registerFilterExtractor: vi.fn(),
    appStats: signal(new Map<string, { running: number; total: number }>()),
    filter: signal(() => true),
    sort: signal({ field: 'name' as const, direction: 'asc' as const }),
    pageSize: signal(6),
    pageIndex: signal(0),
    view,
    orchestrator,
    selectedCnsi: signal<string | null>(null),
    selectedOrg: signal<string | null>(null),
    selectedSpace: signal<string | null>(null),
    nameFilter: signal(''),
    filterField: signal('name'),
    viewMode: signal<'card' | 'table'>('card'),
    orgOptions: signal([allOption]).asReadonly(),
    spaceOptions: signal([allOption]).asReadonly(),
    isLoadingOrgs: signal(false).asReadonly(),
    isLoadingSpaces: signal(false).asReadonly(),
    orgNames: signal(new Map<string, string>()).asReadonly(),
    spaceNames: signal(new Map<string, string>()).asReadonly(),
  };
}

describe('CloudFoundryApplicationsSignalComponent (component)', () => {
  let component: CloudFoundryApplicationsSignalComponent;
  let fixture: ComponentFixture<CloudFoundryApplicationsSignalComponent>;
  let stubAppsConfig: ReturnType<typeof makeStubAppsConfig>;

  beforeEach(async () => {
    stubAppsConfig = makeStubAppsConfig();
    const stubEndpointService = { cfGuid: 'cnsi-1' } as any;
    await TestBed.configureTestingModule({
      imports: [CloudFoundryApplicationsSignalComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        TabNavService,
        { provide: CfAppsSignalConfigService, useValue: stubAppsConfig },
        { provide: CloudFoundryEndpointService, useValue: stubEndpointService },
        { provide: CurrentUserPermissionsService, useValue: { can: () => of(true) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CloudFoundryApplicationsSignalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('builds Org/Space filter dropdowns with no locked Cloud Foundry dropdown', async () => {
    await component.ngOnInit();
    const cfg = component.listConfig();
    expect(cfg).toBeDefined();
    expect(cfg!.filterDropdowns!.map(d => d.label)).toEqual(['Organization', 'Space']);
    expect(cfg!.filterDropdowns![0].selected).toBe(stubAppsConfig.selectedOrg);
    expect(cfg!.filterDropdowns![1].selected).toBe(stubAppsConfig.selectedSpace);
  });

  it('lazily loads this CF’s org/space catalog when a dropdown is first opened', async () => {
    await component.ngOnInit();
    const cfg = component.listConfig();
    // Catalog is NOT fetched on mount — only on first dropdown interaction.
    expect(stubAppsConfig.ensureNamesLoaded).not.toHaveBeenCalled();
    for (const d of cfg!.filterDropdowns!) {
      expect(d.onOpen).toBeTypeOf('function');
      d.onOpen!();
    }
    // Both dropdowns share one handler scoped to the route's single CNSI;
    // the service-side promise dedupes repeated opens to one fanout.
    expect(stubAppsConfig.ensureNamesLoaded).toHaveBeenCalledWith(['cnsi-1']);
  });
});
