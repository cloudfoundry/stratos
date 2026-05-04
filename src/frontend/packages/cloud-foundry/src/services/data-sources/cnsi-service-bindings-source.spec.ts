import { describe, it, expect, vi } from 'vitest';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { CnsiServiceBindingsSource } from './cnsi-service-bindings-source';

describe('CnsiServiceBindingsSource', () => {
  it('create(body) issues POST /pp/v1/cf/service_bindings/{cnsi}', async () => {
    const http = {
      get: vi.fn(() => of({ resources: [], pagination: { totalResults: 0, totalPages: 0, next: null, previous: null, first: { href: '' }, last: { href: '' } } })),
      post: vi.fn(() => of({ guid: 'b-1' })),
    } as unknown as HttpClient;
    const src = new CnsiServiceBindingsSource('cnsi-1', http);
    const payload = { type: 'app', relationships: { app: { data: { guid: 'a' } }, service_instance: { data: { guid: 'si' } } } };
    const created = await src.create(payload);
    expect(http.post).toHaveBeenCalledWith('/pp/v1/cf/service_bindings/cnsi-1', payload);
    expect((created as { guid: string }).guid).toBe('b-1');
  });

  it('delete(bindingGuid) issues DELETE /pp/v1/cf/service_bindings/{cnsi}/{guid}', async () => {
    const http = {
      get: vi.fn(() => of({ resources: [], pagination: { totalResults: 0, totalPages: 0, next: null, previous: null, first: { href: '' }, last: { href: '' } } })),
      delete: vi.fn(() => of(null)),
    } as unknown as HttpClient;
    const src = new CnsiServiceBindingsSource('cnsi-1', http);
    await src.delete('b-1');
    expect(http.delete).toHaveBeenCalledWith('/pp/v1/cf/service_bindings/cnsi-1/b-1');
  });
});
