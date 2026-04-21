import { describe, it, expect, vi } from 'vitest';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { CnsiAppsSource } from './cnsi-apps-source';
import type { StApp } from '../endpoint-data/stratos-types';

function makeHttp(getResp: unknown, deleteResp: unknown = null): HttpClient {
  return {
    get: vi.fn(() => of(getResp)),
    delete: vi.fn(() => of(deleteResp)),
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

  it('delete hits DELETE /pp/v1/cf/apps/{cnsi}/{guid} and removes the row from items()', async () => {
    const resp = {
      resources: [{ guid: 'a', name: 'app-a' }, { guid: 'b', name: 'app-b' }] as unknown as StApp[],
      pagination: { totalResults: 2, totalPages: 1, next: null, previous: null, first: { href: '' }, last: { href: '' } }
    };
    const http = makeHttp(resp);
    const src = new CnsiAppsSource('cnsi-1', http);
    await src.load();
    await src.delete('a');
    expect(http.delete).toHaveBeenCalledWith('/pp/v1/cf/apps/cnsi-1/a');
    expect(src.items().map(i => (i as { guid?: string }).guid)).toEqual(['b']);
  });

  it('delete does not mutate items on HTTP error', async () => {
    const resp = {
      resources: [{ guid: 'a', name: 'app-a' }] as unknown as StApp[],
      pagination: { totalResults: 1, totalPages: 1, next: null, previous: null, first: { href: '' }, last: { href: '' } }
    };
    const http = {
      get: vi.fn(() => of(resp)),
      delete: vi.fn(() => { throw new Error('forbidden'); }),
    } as unknown as HttpClient;
    const src = new CnsiAppsSource('cnsi-1', http);
    await src.load();
    await expect(src.delete('a')).rejects.toThrow('forbidden');
    expect(src.items().map(i => (i as { guid?: string }).guid)).toEqual(['a']);
  });

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
