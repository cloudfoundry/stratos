import { describe, it, expect, vi } from 'vitest';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { CnsiRoutesSource } from './cnsi-routes-source';
import { EndpointDataService } from '../endpoint-data/endpoint-data.service';

function makeEds(): EndpointDataService {
  return { applyCascade: vi.fn() } as unknown as EndpointDataService;
}

describe('CnsiRoutesSource', () => {
  it('unmapApp(routeGuid, appGuid) issues DELETE /pp/v1/cf/routes/{cnsi}/{routeGuid}/apps/{appGuid} + cascade', async () => {
    const http = {
      get: vi.fn(() => of({ resources: [], pagination: { totalResults: 0, totalPages: 0, next: null, previous: null, first: { href: '' }, last: { href: '' } } })),
      delete: vi.fn(() => of(null)),
    } as unknown as HttpClient;
    const eds = makeEds();
    const src = new CnsiRoutesSource('cnsi-1', http, eds);
    await src.unmapApp('route-1', 'app-1');
    expect(http.delete).toHaveBeenCalledWith('/pp/v1/cf/routes/cnsi-1/route-1/apps/app-1');
    expect(eds.applyCascade).toHaveBeenCalledWith('route.delete');
  });

  // route delete moved to EntityDeleteController (see cf-routes-signal-config
  // + cf-apps-signal-config deleteRoute); create + unmapApp stay here.
});
