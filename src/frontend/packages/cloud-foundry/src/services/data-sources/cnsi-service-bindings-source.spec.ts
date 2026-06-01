import { describe, it, expect, vi } from 'vitest';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { CnsiServiceBindingsSource } from './cnsi-service-bindings-source';
import { EndpointDataService } from '../endpoint-data/endpoint-data.service';

function makeEds(): EndpointDataService {
  return {
    addServiceCredentialBinding: vi.fn(),
    removeServiceCredentialBinding: vi.fn(),
    applyCascade: vi.fn(),
  } as unknown as EndpointDataService;
}

describe('CnsiServiceBindingsSource', () => {
  it('create(body) issues POST + patches items + cascade("serviceBinding.create")', async () => {
    const http = {
      get: vi.fn(() => of({ resources: [], pagination: { totalResults: 0, totalPages: 0, next: null, previous: null, first: { href: '' }, last: { href: '' } } })),
      post: vi.fn(() => of({ guid: 'b-1' })),
    } as unknown as HttpClient;
    const eds = makeEds();
    const src = new CnsiServiceBindingsSource('cnsi-1', http, eds);
    const payload = { type: 'app', relationships: { app: { data: { guid: 'a' } }, service_instance: { data: { guid: 'si' } } } };
    const created = await src.create(payload);
    expect(http.post).toHaveBeenCalledWith('/pp/v1/cf/service_bindings/cnsi-1', payload);
    expect((created as { guid: string }).guid).toBe('b-1');
    expect(eds.addServiceCredentialBinding).toHaveBeenCalledWith(created);
    expect(eds.applyCascade).toHaveBeenCalledWith('serviceBinding.create');
  });

  // binding delete moved to EntityDeleteController (see cf-apps-signal-config
  // deleteServiceBinding + the detach-service-instance stepper); create stays.
});
