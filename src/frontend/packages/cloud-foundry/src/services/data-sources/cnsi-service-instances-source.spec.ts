import { describe, it, expect, vi } from 'vitest';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { CnsiServiceInstancesSource } from './cnsi-service-instances-source';
import type { StServiceInstance } from '../endpoint-data/stratos-types';
import { EndpointDataService } from '../endpoint-data/endpoint-data.service';

function makeEds(): EndpointDataService {
  return {
    addServiceInstance: vi.fn(),
    removeServiceInstance: vi.fn(),
    updateServiceInstance: vi.fn(),
    applyCascade: vi.fn(),
  } as unknown as EndpointDataService;
}

describe('CnsiServiceInstancesSource mutations', () => {
  it('delete: DELETE + writeWithJob + patchItems + removeServiceInstance + cascade("serviceInstance.delete")', async () => {
    const resp = {
      resources: [{ guid: 'si-1', name: 'mydb' }] as unknown as StServiceInstance[],
      pagination: { totalResults: 1, totalPages: 1, next: null, previous: null, first: { href: '' }, last: { href: '' } },
    };
    const http = {
      get: vi.fn(() => of(resp)),
      delete: vi.fn(() => of(new HttpResponse({ status: 200, body: null }))),
    } as unknown as HttpClient;
    const eds = makeEds();
    const src = new CnsiServiceInstancesSource('cnsi-1', http, eds);
    await src.load();
    await src.delete('si-1');
    expect(http.delete).toHaveBeenCalledWith('/pp/v1/cf/service_instances/cnsi-1/si-1', { observe: 'response' });
    expect(src.items().map(s => s.guid)).toEqual([]);
    expect(eds.removeServiceInstance).toHaveBeenCalledWith('si-1');
    expect(eds.applyCascade).toHaveBeenCalledWith('serviceInstance.delete');
  });

  it('create: POST + patchItems + addServiceInstance + cascade("serviceInstance.create")', async () => {
    const created = { guid: 'si-2', name: 'cache' } as unknown as StServiceInstance;
    const http = {
      get: vi.fn(() => of({ resources: [], pagination: { totalResults: 0, totalPages: 0, next: null, previous: null, first: { href: '' }, last: { href: '' } } })),
      post: vi.fn(() => of(created)),
    } as unknown as HttpClient;
    const eds = makeEds();
    const src = new CnsiServiceInstancesSource('cnsi-1', http, eds);
    const result = await src.create({ name: 'cache' });
    expect(http.post).toHaveBeenCalledWith('/pp/v1/cf/service_instances/cnsi-1', { name: 'cache' });
    expect(result).toEqual(created);
    expect(eds.addServiceInstance).toHaveBeenCalledWith(created);
    expect(eds.applyCascade).toHaveBeenCalledWith('serviceInstance.create');
  });

  it('update: PATCH + patchItems + updateServiceInstance + cascade("serviceInstance.update")', async () => {
    const resp = {
      resources: [{ guid: 'si-1', name: 'old' }] as unknown as StServiceInstance[],
      pagination: { totalResults: 1, totalPages: 1, next: null, previous: null, first: { href: '' }, last: { href: '' } },
    };
    const updated = { guid: 'si-1', name: 'renamed' } as unknown as StServiceInstance;
    const http = {
      get: vi.fn(() => of(resp)),
      patch: vi.fn(() => of(updated)),
    } as unknown as HttpClient;
    const eds = makeEds();
    const src = new CnsiServiceInstancesSource('cnsi-1', http, eds);
    await src.load();
    await src.update('si-1', { name: 'renamed' });
    expect(http.patch).toHaveBeenCalledWith('/pp/v1/cf/service_instances/cnsi-1/si-1', { name: 'renamed' });
    expect(eds.updateServiceInstance).toHaveBeenCalledWith('si-1', updated);
    expect(eds.applyCascade).toHaveBeenCalledWith('serviceInstance.update');
  });

  it('eds optional — source still patches its own _items', async () => {
    const resp = {
      resources: [{ guid: 'si-1' }] as unknown as StServiceInstance[],
      pagination: { totalResults: 1, totalPages: 1, next: null, previous: null, first: { href: '' }, last: { href: '' } },
    };
    const http = {
      get: vi.fn(() => of(resp)),
      delete: vi.fn(() => of(new HttpResponse({ status: 200, body: null }))),
    } as unknown as HttpClient;
    const src = new CnsiServiceInstancesSource('cnsi-1', http);  // no eds
    await src.load();
    await src.delete('si-1');
    expect(src.items().map(s => s.guid)).toEqual([]);
  });
});
