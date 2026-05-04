import { describe, it, expect, vi } from 'vitest';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { CnsiRoutesSource } from './cnsi-routes-source';

describe('CnsiRoutesSource', () => {
  it('unmapApp(routeGuid, appGuid) issues DELETE /pp/v1/cf/routes/{cnsi}/{routeGuid}/apps/{appGuid}', async () => {
    const http = {
      get: vi.fn(() => of({ resources: [], pagination: { totalResults: 0, totalPages: 0, next: null, previous: null, first: { href: '' }, last: { href: '' } } })),
      delete: vi.fn(() => of(null)),
    } as unknown as HttpClient;
    const src = new CnsiRoutesSource('cnsi-1', http);
    await src.unmapApp('route-1', 'app-1');
    expect(http.delete).toHaveBeenCalledWith('/pp/v1/cf/routes/cnsi-1/route-1/apps/app-1');
  });
});
