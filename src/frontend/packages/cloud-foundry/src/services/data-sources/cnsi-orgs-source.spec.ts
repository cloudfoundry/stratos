import { describe, it, expect, vi } from 'vitest';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { CnsiOrgsSource } from './cnsi-orgs-source';
import type { StOrg } from '../endpoint-data/stratos-types';
import { EndpointDataService } from '../endpoint-data/endpoint-data.service';

function makeEds(): EndpointDataService {
  return {
    removeOrg: vi.fn(),
    addOrg: vi.fn(),
    updateOrg: vi.fn(),
    applyCascade: vi.fn(),
  } as unknown as EndpointDataService;
}

describe('CnsiOrgsSource', () => {
  // Org delete moved to EntityDeleteController (see cf-orgs-signal-config
  // deleteOrg + entity-delete.controller.spec). create/update stay here.

  it('create: POST + addOrg + cascade("org.create")', async () => {
    const newOrg: StOrg = { guid: 'org-2', name: 'new' } as unknown as StOrg;
    const http = {
      post: vi.fn(() => of(newOrg)),
    } as unknown as HttpClient;
    const eds = makeEds();
    const src = new CnsiOrgsSource('cnsi-1', http, eds);
    const result = await src.create({ name: 'new' });
    expect(http.post).toHaveBeenCalledWith('/pp/v1/cf/orgs/cnsi-1', { name: 'new' });
    expect(eds.addOrg).toHaveBeenCalledWith(newOrg);
    expect(eds.applyCascade).toHaveBeenCalledWith('org.create');
    expect(result).toEqual(newOrg);
  });

  it('update: PATCH + updateOrg + cascade("org.update")', async () => {
    const updated: StOrg = { guid: 'org-1', name: 'renamed' } as unknown as StOrg;
    const http = {
      patch: vi.fn(() => of(updated)),
    } as unknown as HttpClient;
    const eds = makeEds();
    const src = new CnsiOrgsSource('cnsi-1', http, eds);
    await src.update('org-1', { name: 'renamed' });
    expect(http.patch).toHaveBeenCalledWith('/pp/v1/cf/orgs/cnsi-1/org-1', { name: 'renamed' });
    expect(eds.updateOrg).toHaveBeenCalledWith('org-1', updated);
    expect(eds.applyCascade).toHaveBeenCalledWith('org.update');
  });
});
