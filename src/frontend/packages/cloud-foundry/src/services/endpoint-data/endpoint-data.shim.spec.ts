import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { Store } from '@ngrx/store';
import { EntityCatalogTestModuleManualStore, TEST_CATALOGUE_ENTITIES } from '@stratosui/store';
import { createBasicStoreModule } from '@stratosui/store/testing';
import { generateCFEntities } from '../../cf-entity-generator';
import { EndpointDataShim } from './endpoint-data.shim';
import { StApp, StEndpointData, StOrg, StSpace } from './stratos-types';

const org: StOrg = {
  guid: 'org-1',
  name: 'Org One',
  status: 'active',
  labels: {},
  annotations: {},
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
  cnsiGuid: 'cnsi-1',
};
const app: StApp = {
  guid: 'app-1',
  name: 'App One',
  state: 'STARTED',
  orgGuid: 'org-1',
  spaceGuid: 'space-1',
  instances: 2,
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
  cnsiGuid: 'cnsi-1',
};
const space: StSpace = {
  guid: 'space-1',
  name: 'Space One',
  orgGuid: 'org-1',
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
  cnsiGuid: 'cnsi-1',
};

function empty(): StEndpointData {
  return { orgs: [], orgCount: 0, apps: [], recentApps: [], appCount: 0, spaces: [], routeCount: 0 };
}

describe('EndpointDataShim', () => {
  let shim: EndpointDataShim;
  let dispatchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        {
          ngModule: EntityCatalogTestModuleManualStore,
          providers: [
            { provide: TEST_CATALOGUE_ENTITIES, useValue: generateCFEntities() },
          ],
        },
        createBasicStoreModule({}),
      ],
      providers: [
        provideZonelessChangeDetection(),
        EndpointDataShim,
      ],
    });
    shim = TestBed.inject(EndpointDataShim);
    const store = TestBed.inject(Store);
    dispatchSpy = vi.spyOn(store, 'dispatch').mockImplementation(() => undefined) as unknown as ReturnType<typeof vi.fn>;
  });

  it('dispatches 3 actions (orgs + apps + spaces) even when all arrays are empty (clears stale state)', () => {
    shim.write('cnsi-1', empty());
    expect(dispatchSpy).toHaveBeenCalledTimes(3);
    const orgDispatch = dispatchSpy.mock.calls[0][0];
    expect(orgDispatch.response.result).toEqual([]);
    expect(orgDispatch.totalResults).toBe(0);
  });

  it('dispatches an orgs WrapperRequestActionSuccess with composite entity IDs', () => {
    shim.write('cnsi-1', { ...empty(), orgs: [org], orgCount: 1 });
    const action = dispatchSpy.mock.calls.find(c => c[0].apiAction.paginationKey === 'endpoint-cnsi-1')[0];
    // FWT-934: entity dictionary keys are now cnsiGuid:guid composite.
    expect(action.response.entities.cfOrganization['cnsi-1:org-1']).toBeDefined();
    expect(action.response.entities.cfOrganization['cnsi-1:org-1'].entity.name).toBe('Org One');
    expect(action.response.entities.cfOrganization['cnsi-1:org-1'].metadata.guid).toBe('org-1');
    expect(action.response.result).toEqual(['cnsi-1:org-1']);
    expect(action.totalResults).toBe(1);
    expect(action.totalPages).toBe(1);
  });

  it('dispatches apps through the shim under composite keys (workaround retired)', () => {
    shim.write('cnsi-1', { ...empty(), apps: [app], appCount: 1 });
    const appDispatch = dispatchSpy.mock.calls.find(c => c[0].apiAction?.paginationKey === 'applicationWall');
    expect(appDispatch).toBeDefined();
    const action = appDispatch![0];
    expect(action.response.entities.cfApplication['cnsi-1:app-1']).toBeDefined();
    expect(action.response.entities.cfApplication['cnsi-1:app-1'].entity.name).toBe('App One');
    expect(action.response.result).toEqual(['cnsi-1:app-1']);
  });

  it('dispatches a spaces WrapperRequestActionSuccess with composite keys under synthetic pagination key', () => {
    shim.write('cnsi-1', { ...empty(), spaces: [space] });
    const action = dispatchSpy.mock.calls.find(c => c[0].apiAction.paginationKey === 'spaces-bulk-cnsi-1')[0];
    expect(action.response.entities.cfSpace['cnsi-1:space-1'].entity.organization_guid).toBe('org-1');
  });

  it('always dispatches orgs + apps + spaces regardless of data presence', () => {
    shim.write('cnsi-1', { ...empty(), orgs: [org], orgCount: 1, apps: [app], appCount: 1, spaces: [space] });
    expect(dispatchSpy).toHaveBeenCalledTimes(3);
    const keys = dispatchSpy.mock.calls.map(c => c[0].apiAction?.paginationKey);
    expect(keys).toContain('endpoint-cnsi-1');
    expect(keys).toContain('applicationWall');
    expect(keys).toContain('spaces-bulk-cnsi-1');
  });

  it('emits entity-size-sample per dispatched entity via StratosDiagnostics', async () => {
    const { StratosDiagnostics } = await import('../diagnostics/stratos-diagnostics.service');
    const diagnostics = TestBed.inject(StratosDiagnostics);
    diagnostics.reset();
    shim.write('cnsi-1', { ...empty(), orgs: [org], orgCount: 1, apps: [app], appCount: 1, spaces: [space] });
    await diagnostics.waitForFlush();
    const samples = diagnostics.snapshot().samples['entity-size-sample'] ?? [];
    const orgSamples = samples.filter(s => s.dimensions.entityType === 'organization' && s.dimensions.cnsiGuid === 'cnsi-1');
    const appSamples = samples.filter(s => s.dimensions.entityType === 'application' && s.dimensions.cnsiGuid === 'cnsi-1');
    const spaceSamples = samples.filter(s => s.dimensions.entityType === 'space' && s.dimensions.cnsiGuid === 'cnsi-1');
    expect(orgSamples).toHaveLength(1);
    expect(appSamples).toHaveLength(1);
    expect(spaceSamples).toHaveLength(1);
    expect(orgSamples[0].value).toBeGreaterThan(0);
  });
});
