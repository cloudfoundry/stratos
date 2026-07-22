import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { organizationEntityType, spaceEntityType } from '../../cf-entity-types';
import { OrgDataRegistry } from '../endpoint-data/org-data.registry';
import { SpaceDataRegistry } from '../endpoint-data/space-data.registry';
import type { DeleteRequest } from './delete-event.types';
import { DetailCachesDeleteCleanup } from './detail-caches-cleanup.service';

function req(entityKind: string, deleteGuid = 'guid-1'): DeleteRequest {
  return {
    cnsiGuid: 'cf-1',
    cnsiName: 'cf',
    entityKind,
    deleteGuid,
    deleteName: 'thing',
    call: () => undefined as any,
  };
}

describe('DetailCachesDeleteCleanup', () => {
  let orgRegistry: { peekByCnsi: ReturnType<typeof vi.fn>; evict: ReturnType<typeof vi.fn> };
  let spaceRegistry: { evict: ReturnType<typeof vi.fn> };
  let applySpaceDeleted: ReturnType<typeof vi.fn>;
  let service: DetailCachesDeleteCleanup;

  beforeEach(() => {
    applySpaceDeleted = vi.fn();
    orgRegistry = {
      peekByCnsi: vi.fn(() => [{ applySpaceDeleted }]),
      evict: vi.fn(),
    };
    spaceRegistry = { evict: vi.fn() };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: OrgDataRegistry, useValue: orgRegistry },
        { provide: SpaceDataRegistry, useValue: spaceRegistry },
        DetailCachesDeleteCleanup,
      ],
    });
    service = TestBed.inject(DetailCachesDeleteCleanup);
  });

  it('on space delete, drops the space from every cached org detail and evicts its own detail cache', () => {
    service.hook(req(spaceEntityType, 'sp-1'));
    expect(orgRegistry.peekByCnsi).toHaveBeenCalledWith('cf-1');
    expect(applySpaceDeleted).toHaveBeenCalledWith('sp-1');
    expect(spaceRegistry.evict).toHaveBeenCalledWith('cf-1', 'sp-1');
    expect(orgRegistry.evict).not.toHaveBeenCalled();
  });

  it('on org delete, evicts the org detail cache', () => {
    service.hook(req(organizationEntityType, 'org-1'));
    expect(orgRegistry.evict).toHaveBeenCalledWith('cf-1', 'org-1');
    expect(applySpaceDeleted).not.toHaveBeenCalled();
    expect(spaceRegistry.evict).not.toHaveBeenCalled();
  });

  it('no-ops for other entity kinds', () => {
    service.hook(req('application'));
    expect(orgRegistry.peekByCnsi).not.toHaveBeenCalled();
    expect(orgRegistry.evict).not.toHaveBeenCalled();
    expect(spaceRegistry.evict).not.toHaveBeenCalled();
  });
});
