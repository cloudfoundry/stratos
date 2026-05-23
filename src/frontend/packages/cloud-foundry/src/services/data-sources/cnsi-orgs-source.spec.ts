import { describe, it, expect, vi } from 'vitest';
import { HttpClient, HttpResponse } from '@angular/common/http';
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
  it('delete: DELETE + writeWithJob + removeOrg + cascade("org.delete")', async () => {
    const http = {
      delete: vi.fn(() => of(new HttpResponse({ status: 200, body: null }))),
    } as unknown as HttpClient;
    const eds = makeEds();
    const src = new CnsiOrgsSource('cnsi-1', http, eds);
    await src.delete('org-1');
    expect(http.delete).toHaveBeenCalledWith('/pp/v1/cf/orgs/cnsi-1/org-1', { observe: 'response' });
    expect(eds.removeOrg).toHaveBeenCalledWith('org-1');
    expect(eds.applyCascade).toHaveBeenCalledWith('org.delete');
  });

  it('delete: does not patch EDS on HTTP failure', async () => {
    const http = {
      delete: vi.fn(() => { throw new Error('forbidden'); }),
    } as unknown as HttpClient;
    const eds = makeEds();
    const src = new CnsiOrgsSource('cnsi-1', http, eds);
    await expect(src.delete('org-1')).rejects.toThrow('forbidden');
    expect(eds.removeOrg).not.toHaveBeenCalled();
    expect(eds.applyCascade).not.toHaveBeenCalled();
  });

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
