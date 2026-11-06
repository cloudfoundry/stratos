import { describe, it, expect, vi } from 'vitest';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { CnsiAppsSource } from './cnsi-apps-source';
import type { StApp } from '../endpoint-data/stratos-types';

// delete goes through writeWithJob which uses { observe: 'response' },
// so the mock needs to return an HttpResponse-shaped body. Default: an
// empty-body 200 which writeWithJob treats as sync-fast COMPLETE.
function makeHttp(getResp: unknown, deleteResp: unknown = null): HttpClient {
  return {
    get: vi.fn(() => of(getResp)),
    delete: vi.fn(() => of(new HttpResponse({ status: 200, body: deleteResp }))),
  } as unknown as HttpClient;
}

describe('CnsiAppsSource', () => {
  it('load fetches from /pp/v1/cf/apps/{cnsi}?return=summary', async () => {
    const resp = {
      resources: [{ guid: 'a', name: 'app-a' } as unknown as StApp],
      pagination: { totalResults: 1, totalPages: 1, next: null, previous: null, first: { href: '' }, last: { href: '' } }
    };
    const http = makeHttp(resp);
    const src = new CnsiAppsSource('cnsi-1', http);
    await src.load();
    expect(http.get).toHaveBeenCalledWith(expect.stringMatching(/^\/pp\/v1\/cf\/apps\/cnsi-1\?return=summary/));
    expect(src.items()).toHaveLength(1);
  });

  // app delete moved to EntityDeleteController (see cf-apps-signal-config
  // deleteApp); create/update/action/deleteInstance stay here.

  it('update(guid, patch) issues PATCH and patches local items', async () => {
    const initial = {
      resources: [{ guid: 'a', name: 'old', state: 'STOPPED' }] as unknown as StApp[],
      pagination: { totalResults: 1, totalPages: 1, next: null, previous: null, first: { href: '' }, last: { href: '' } }
    };
    const patched = { guid: 'a', name: 'new' };
    const http = {
      get: vi.fn(() => of(initial)),
      patch: vi.fn(() => of(patched)),
    } as unknown as HttpClient;
    const src = new CnsiAppsSource('cnsi-1', http);
    await src.load();
    await src.update('a', { name: 'new' });
    expect(http.patch).toHaveBeenCalledWith('/pp/v1/cf/apps/cnsi-1/a', { name: 'new' });
    expect((src.items()[0] as any).name).toBe('new');
  });

  it('action(guid, verb) issues POST to /actions/{verb} and patches state', async () => {
    const initial = {
      resources: [{ guid: 'a', name: 'app', state: 'STOPPED' }] as unknown as StApp[],
      pagination: { totalResults: 1, totalPages: 1, next: null, previous: null, first: { href: '' }, last: { href: '' } }
    };
    const http = {
      get: vi.fn(() => of(initial)),
      post: vi.fn(() => of({ guid: 'a', state: 'STARTED' })),
    } as unknown as HttpClient;
    const src = new CnsiAppsSource('cnsi-1', http);
    await src.load();
    await src.action('a', 'start');
    expect(http.post).toHaveBeenCalledWith('/pp/v1/cf/apps/cnsi-1/a/actions/start', null);
    expect((src.items()[0] as any).state).toBe('STARTED');
  });

  it('deleteInstance(guid, idx) issues DELETE to .../instances/{idx}', async () => {
    const http = {
      get: vi.fn(() => of({ resources: [], pagination: { totalResults: 0, totalPages: 0, next: null, previous: null, first: { href: '' }, last: { href: '' } } })),
      delete: vi.fn(() => of(null)),
    } as unknown as HttpClient;
    const src = new CnsiAppsSource('cnsi-1', http);
    await src.deleteInstance('a', 3);
    expect(http.delete).toHaveBeenCalledWith('/pp/v1/cf/apps/cnsi-1/a/instances/3');
  });

  it('assignRoute(appGuid, routeGuid) issues PUT', async () => {
    const http = {
      get: vi.fn(() => of({ resources: [], pagination: { totalResults: 0, totalPages: 0, next: null, previous: null, first: { href: '' }, last: { href: '' } } })),
      put: vi.fn(() => of({})),
    } as unknown as HttpClient;
    const src = new CnsiAppsSource('cnsi-1', http);
    await src.assignRoute('a', 'r-1');
    expect(http.put).toHaveBeenCalledWith('/pp/v1/cf/apps/cnsi-1/a/routes/r-1', {});
  });
});

// Apps are drained per endpoint by EndpointDataService. The source used to
// run its own drain unless handed a finished cache, so mounting the wall
// while the endpoint drain was in flight ran both.
describe('CnsiAppsSource — joins the endpoint apps load', () => {
  const app = { guid: 'a', name: 'from-eds' } as unknown as StApp;

  function makeEds(apps: StApp[]) {
    return {
      loadApps: vi.fn(() => of(undefined)),
      refreshApps: vi.fn(() => of(undefined)),
      apps: () => apps,
    };
  }

  it('load() joins the shared drain instead of fetching', async () => {
    const http = makeHttp({ resources: [], pagination: { totalResults: 0, totalPages: 1, next: null } });
    const eds = makeEds([app]);
    const src = new CnsiAppsSource('cnsi-1', http, eds as never);

    await src.load();

    expect(eds.loadApps).toHaveBeenCalledTimes(1);
    expect(http.get).not.toHaveBeenCalled();
    expect(src.items()).toEqual([app]);
    expect(src.loading()).toBe(false);
  });

  it('refresh() bypasses the shared cache rather than joining it', async () => {
    const http = makeHttp({ resources: [], pagination: { totalResults: 0, totalPages: 1, next: null } });
    const eds = makeEds([app]);
    const src = new CnsiAppsSource('cnsi-1', http, eds as never);

    await src.refresh();

    // User asked for current data — a cache-serving loadApps() would defeat it.
    expect(eds.refreshApps).toHaveBeenCalledTimes(1);
    expect(eds.loadApps).not.toHaveBeenCalled();
    expect(http.get).not.toHaveBeenCalled();
  });

  it('still drains itself when no endpoint service was threaded in', async () => {
    const http = makeHttp({
      resources: [{ guid: 'b', name: 'own-drain' } as unknown as StApp],
      pagination: { totalResults: 1, totalPages: 1, next: null },
    });
    const src = new CnsiAppsSource('cnsi-1', http);

    await src.load();

    expect(http.get).toHaveBeenCalled();
    expect(src.items()).toHaveLength(1);
  });
});
