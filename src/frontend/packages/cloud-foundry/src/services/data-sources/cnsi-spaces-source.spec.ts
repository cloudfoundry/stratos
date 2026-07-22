import { describe, it, expect, vi } from 'vitest';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { CnsiSpacesSource } from './cnsi-spaces-source';
import type { StSpace } from '../endpoint-data/stratos-types';
import { EndpointDataService } from '../endpoint-data/endpoint-data.service';

function makeEds(): EndpointDataService {
  return {
    removeSpace: vi.fn(),
    addSpace: vi.fn(),
    updateSpace: vi.fn(),
    applyCascade: vi.fn(),
  } as unknown as EndpointDataService;
}

describe('CnsiSpacesSource', () => {
  // Space delete moved to EntityDeleteController (see cf-spaces-signal-config
  // deleteSpace + entity-delete.controller.spec). create/update stay here.

  it('create: POST + addSpace + cascade("space.create")', async () => {
    const newSpace: StSpace = { guid: 'sp-2', name: 'new' } as unknown as StSpace;
    const http = {
      post: vi.fn(() => of(newSpace)),
    } as unknown as HttpClient;
    const eds = makeEds();
    const src = new CnsiSpacesSource('cnsi-1', http, eds);
    const result = await src.create({ name: 'new' });
    expect(http.post).toHaveBeenCalledWith('/pp/v1/cf/spaces/cnsi-1', { name: 'new' });
    expect(eds.addSpace).toHaveBeenCalledWith(newSpace);
    expect(eds.applyCascade).toHaveBeenCalledWith('space.create');
    expect(result).toEqual(newSpace);
  });

  it('update: PATCH + updateSpace + cascade("space.update")', async () => {
    const updated: StSpace = { guid: 'sp-1', name: 'renamed' } as unknown as StSpace;
    const http = {
      patch: vi.fn(() => of(updated)),
    } as unknown as HttpClient;
    const eds = makeEds();
    const src = new CnsiSpacesSource('cnsi-1', http, eds);
    await src.update('sp-1', { name: 'renamed' });
    expect(http.patch).toHaveBeenCalledWith('/pp/v1/cf/spaces/cnsi-1/sp-1', { name: 'renamed' });
    expect(eds.updateSpace).toHaveBeenCalledWith('sp-1', updated);
    expect(eds.applyCascade).toHaveBeenCalledWith('space.update');
  });
});
