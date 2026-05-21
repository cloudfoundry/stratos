import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { EndpointDataShim } from './endpoint-data.shim';
import { StApp, StEndpointData, StOrg, StSpace } from './stratos-types';
import { StratosDiagnostics } from '../diagnostics/stratos-diagnostics.service';

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
  routes: [],
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
  let diagnostics: StratosDiagnostics;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        EndpointDataShim,
        StratosDiagnostics,
      ],
    });
    shim = TestBed.inject(EndpointDataShim);
    diagnostics = TestBed.inject(StratosDiagnostics);
    diagnostics.reset();
  });

  it('write() emits no diagnostics when both orgs and spaces are empty', async () => {
    shim.write('cnsi-1', empty());
    await diagnostics.waitForFlush();
    const samples = diagnostics.snapshot().samples['entity-size-sample'] ?? [];
    expect(samples).toHaveLength(0);
  });

  it('emits entity-size-sample per org and per space', async () => {
    shim.write('cnsi-1', { ...empty(), orgs: [org], orgCount: 1, apps: [app], appCount: 1, spaces: [space] });
    await diagnostics.waitForFlush();
    const samples = diagnostics.snapshot().samples['entity-size-sample'] ?? [];
    const orgSamples = samples.filter(s => s.dimensions.entityType === 'organization' && s.dimensions.cnsiGuid === 'cnsi-1');
    const spaceSamples = samples.filter(s => s.dimensions.entityType === 'space' && s.dimensions.cnsiGuid === 'cnsi-1');
    expect(orgSamples).toHaveLength(1);
    expect(spaceSamples).toHaveLength(1);
    expect(orgSamples[0].value).toBeGreaterThan(0);
    expect(spaceSamples[0].value).toBeGreaterThan(0);
  });

  it('does not emit samples for apps — apps stay out of the shim entirely', async () => {
    shim.write('cnsi-1', { ...empty(), apps: [app], appCount: 1 });
    await diagnostics.waitForFlush();
    const samples = diagnostics.snapshot().samples['entity-size-sample'] ?? [];
    expect(samples).toHaveLength(0);
  });
});
