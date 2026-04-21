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
});
