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
};
const space: StSpace = {
  guid: 'space-1',
  name: 'Space One',
  orgGuid: 'org-1',
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
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

  it('dispatches 2 actions (orgs + spaces) even when all arrays are empty (clears stale state)', () => {
    shim.write('cnsi-1', empty());
    expect(dispatchSpy).toHaveBeenCalledTimes(2);
    const orgDispatch = dispatchSpy.mock.calls[0][0];
    expect(orgDispatch.response.result).toEqual([]);
    expect(orgDispatch.totalResults).toBe(0);
  });

  it('dispatches an orgs WrapperRequestActionSuccess when orgs are present', () => {
    shim.write('cnsi-1', { ...empty(), orgs: [org], orgCount: 1 });
    const action = dispatchSpy.mock.calls.find(c => c[0].apiAction.paginationKey === 'endpoint-cnsi-1')[0];
    expect(action.response.entities.cfOrganization['org-1']).toBeDefined();
    expect(action.response.entities.cfOrganization['org-1'].entity.name).toBe('Org One');
    expect(action.response.entities.cfOrganization['org-1'].metadata.guid).toBe('org-1');
    expect(action.response.result).toEqual(['org-1']);
    expect(action.totalResults).toBe(1);
    expect(action.totalPages).toBe(1);
  });

  it('does NOT dispatch apps — app wall manages its own multi-endpoint aggregation', () => {
    shim.write('cnsi-1', { ...empty(), apps: [app], appCount: 1 });
    const appDispatches = dispatchSpy.mock.calls.filter(c => c[0].apiAction?.paginationKey === 'applicationWall');
    expect(appDispatches).toHaveLength(0);
  });

  it('dispatches a spaces WrapperRequestActionSuccess with synthetic pagination key', () => {
    shim.write('cnsi-1', { ...empty(), spaces: [space] });
    const action = dispatchSpy.mock.calls.find(c => c[0].apiAction.paginationKey === 'spaces-bulk-cnsi-1')[0];
    expect(action.response.entities.cfSpace['space-1'].entity.organization_guid).toBe('org-1');
  });

  it('always dispatches orgs + spaces (no apps) regardless of data presence', () => {
    shim.write('cnsi-1', { ...empty(), orgs: [org], orgCount: 1, apps: [app], appCount: 1, spaces: [space] });
    expect(dispatchSpy).toHaveBeenCalledTimes(2);
    const keys = dispatchSpy.mock.calls.map(c => c[0].apiAction?.paginationKey);
    expect(keys).not.toContain('applicationWall');
  });
});
