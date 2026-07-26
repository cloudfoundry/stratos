import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';
import { EntityDeleteController } from '../../../services/deletes/entity-delete.controller';
import { CfRoutesSignalConfigService } from './cf-routes-signal-config.service';

// The full route list has no slice on EndpointDataService to join (it keeps
// only _routeCount), so this service is its own single owner — the cache and
// in-flight guard live here. Before that, every mount re-drained the list.
describe('CfRoutesSignalConfigService — route list fetch guard', () => {
  const routesUrl = (url: unknown) => typeof url === 'string' && /\/pp\/v1\/cf\/routes\/[^/?]+$/.test(url);

  let routesStale = false;

  function makeHttp(): HttpClient {
    return {
      get: vi.fn((url: string) => {
        if (routesUrl(url)) {
          return of({ resources: [{ guid: 'r1', url: 'a.example.com', spaceGuid: 'sp-1' }] });
        }
        return of({ resources: [], pagination: { totalResults: 0, totalPages: 1, next: null } });
      }),
    } as unknown as HttpClient;
  }

  function makeSvc(http: HttpClient): CfRoutesSignalConfigService {
    const eds = {
      loadDetails: () => of(undefined),
      routesStale: () => routesStale,
      apps: () => [],
      orgs: () => [],
      spaces: () => [],
      isLoadingOrgs: () => false,
      isLoadingSpaces: () => false,
      refreshApps: () => of(undefined),
    };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: HttpClient, useValue: http },
        { provide: EndpointDataRegistry, useValue: { acquire: vi.fn(() => eds), peek: vi.fn(() => eds), release: vi.fn() } },
        { provide: EntityDeleteController, useValue: {} },
        CfRoutesSignalConfigService,
      ],
    });
    return TestBed.inject(CfRoutesSignalConfigService);
  }

  const routeFetches = (http: HttpClient) =>
    (http.get as unknown as { mock: { calls: unknown[][] } }).mock.calls.filter(c => routesUrl(c[0]));

  beforeEach(() => { routesStale = false; TestBed.resetTestingModule(); });
  afterEach(() => TestBed.resetTestingModule());

  it('re-mounting the same endpoint serves the cached list', async () => {
    const http = makeHttp();
    const svc = makeSvc(http);

    svc.initialize('cnsi-1');
    await Promise.resolve();
    await Promise.resolve();
    svc.initialize('cnsi-1');
    await Promise.resolve();

    expect(routeFetches(http).length).toBe(1);
  });

  it('refetches when the cascade marked routes stale', async () => {
    const http = makeHttp();
    const svc = makeSvc(http);

    svc.initialize('cnsi-1');
    await Promise.resolve();
    await Promise.resolve();
    // A write touching routes flips this — the cached list is now wrong.
    routesStale = true;
    svc.initialize('cnsi-1');
    await Promise.resolve();

    expect(routeFetches(http).length).toBe(2);
  });

  it('refetches when the endpoint changes', async () => {
    const http = makeHttp();
    const svc = makeSvc(http);

    svc.initialize('cnsi-1');
    await Promise.resolve();
    await Promise.resolve();
    svc.initialize('cnsi-2');
    await Promise.resolve();

    expect(routeFetches(http).length).toBe(2);
  });

  it('refresh() bypasses the cache', async () => {
    const http = makeHttp();
    const svc = makeSvc(http);

    svc.initialize('cnsi-1');
    await Promise.resolve();
    await Promise.resolve();
    await svc.refresh();

    expect(routeFetches(http).length).toBe(2);
  });
});
