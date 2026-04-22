import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { CfAppsSignalConfigService } from './cf-apps-signal-config.service';
import { CloudFoundryService } from '../../../../data-services/cloud-foundry.service';
import type { StApp } from '../../../../../services/endpoint-data/stratos-types';

function makeHttp(): HttpClient {
  return {
    get: vi.fn(() => of({
      resources: [],
      pagination: { totalResults: 0, totalPages: 1, next: null, previous: null, first: { href: '' }, last: { href: '' } },
    })),
  } as unknown as HttpClient;
}

// Stub CloudFoundryService to avoid ngrx store wiring. The real service's
// constructor touches `stratosEntityCatalog.endpoint.store` which isn't
// available in this lightweight test setup.
function makeStubCfService(endpoints: Array<{ guid: string; name: string }> = []): CloudFoundryService {
  return { connectedCFEndpoints$: of(endpoints) } as unknown as CloudFoundryService;
}

// Instantiate the service via TestBed so inject() inside its constructor
// has a valid injection context.
function makeSvc(http: HttpClient, cf?: CloudFoundryService): CfAppsSignalConfigService {
  TestBed.configureTestingModule({
    providers: [
      { provide: HttpClient, useValue: http },
      { provide: CloudFoundryService, useValue: cf ?? makeStubCfService() },
      CfAppsSignalConfigService,
    ],
  });
  return TestBed.inject(CfAppsSignalConfigService);
}

beforeEach(() => TestBed.resetTestingModule());

describe('CfAppsSignalConfigService', () => {
  it('constructs one CnsiAppsSource per connected CF in scope', () => {
    const http = makeHttp();
    const svc = makeSvc(http);
    svc.initialize(['cnsi-1', 'cnsi-2']);
    expect(svc.orchestrator.sources.map(s => s.cnsiGuid)).toEqual(['cnsi-1', 'cnsi-2']);
  });

  it('exposes a ViewPipeline with filter / sort / pagination signals', () => {
    const http = makeHttp();
    const svc = makeSvc(http);
    svc.initialize(['cnsi-1']);
    expect(svc.view).toBeDefined();
    expect(svc.filter).toBeDefined();
    expect(svc.sort).toBeDefined();
    expect(svc.pageSize).toBeDefined();
    expect(svc.pageIndex).toBeDefined();
  });

  it('selectedCnsi excludes apps from other CFs via the filter signal', () => {
    const http = makeHttp();
    const svc = makeSvc(http);
    const a: StApp = { guid: 'a', name: 'a-app', state: 'STARTED', cnsiGuid: 'cf-1', spaceGuid: 'sp-1', instances: 1, createdAt: '', updatedAt: '' };
    const b: StApp = { guid: 'b', name: 'b-app', state: 'STARTED', cnsiGuid: 'cf-2', spaceGuid: 'sp-2', instances: 1, createdAt: '', updatedAt: '' };
    // Flush the initial effect so the filter predicate is installed.
    TestBed.tick();
    const pred = svc.filter();
    expect(pred(a)).toBe(true);
    expect(pred(b)).toBe(true);
    svc.selectedCnsi.set('cf-1');
    TestBed.tick();
    const pred2 = svc.filter();
    expect(pred2(a)).toBe(true);
    expect(pred2(b)).toBe(false);
  });

  it('nameFilter is applied as a case-insensitive substring match', () => {
    const http = makeHttp();
    const svc = makeSvc(http);
    const foo: StApp = { guid: 'a', name: 'FooBar', state: 'STARTED', cnsiGuid: 'cf-1', spaceGuid: 'sp-1', instances: 1, createdAt: '', updatedAt: '' };
    const baz: StApp = { guid: 'b', name: 'Baz', state: 'STARTED', cnsiGuid: 'cf-1', spaceGuid: 'sp-1', instances: 1, createdAt: '', updatedAt: '' };
    svc.nameFilter.set('foo');
    TestBed.tick();
    const pred = svc.filter();
    expect(pred(foo)).toBe(true);
    expect(pred(baz)).toBe(false);
  });

  it('exposes computed option signals for CF/org/space dropdowns', () => {
    const http = makeHttp();
    const svc = makeSvc(http);
    expect(svc.cnsiOptions).toBeDefined();
    expect(svc.orgOptions).toBeDefined();
    expect(svc.spaceOptions).toBeDefined();
    // Before initialize(), the orchestrator is unset but options should still
    // resolve (to at least the "All" placeholder).
    expect(svc.orgOptions()[0]).toEqual({ label: 'All', value: null });
    expect(svc.spaceOptions()[0]).toEqual({ label: 'All', value: null });
  });

  it('cnsiOptions picks up connected CF endpoints from CloudFoundryService', () => {
    const http = makeHttp();
    const cf = makeStubCfService([
      { guid: 'cf-1', name: 'Primary CF' },
      { guid: 'cf-2', name: 'Secondary CF' },
    ]);
    const svc = makeSvc(http, cf);
    const opts = svc.cnsiOptions();
    expect(opts[0]).toEqual({ label: 'All', value: null });
    expect(opts).toContainEqual({ label: 'Primary CF', value: 'cf-1' });
    expect(opts).toContainEqual({ label: 'Secondary CF', value: 'cf-2' });
  });
});
