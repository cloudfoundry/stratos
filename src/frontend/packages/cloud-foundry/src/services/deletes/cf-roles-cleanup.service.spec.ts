import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { organizationEntityType, spaceEntityType } from '../../cf-entity-types';
import { CfCurrentUserRolesDataService } from '../cf-current-user-roles-data.service';
import type { DeleteRequest } from './delete-event.types';
import { CfRolesDeleteCleanup } from './cf-roles-cleanup.service';

function req(entityKind: string): DeleteRequest {
  return {
    cnsiGuid: 'cf-1',
    cnsiName: 'cf',
    entityKind,
    deleteGuid: 'guid-1',
    deleteName: 'thing',
    call: () => undefined as any,
  };
}

describe('CfRolesDeleteCleanup', () => {
  let removeOrg: ReturnType<typeof vi.fn>;
  let removeSpace: ReturnType<typeof vi.fn>;
  let service: CfRolesDeleteCleanup;

  beforeEach(() => {
    removeOrg = vi.fn();
    removeSpace = vi.fn();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: CfCurrentUserRolesDataService, useValue: { removeOrg, removeSpace } },
        CfRolesDeleteCleanup,
      ],
    });
    service = TestBed.inject(CfRolesDeleteCleanup);
  });

  it('drops the org from the role cache on org delete', () => {
    service.hook(req(organizationEntityType));
    expect(removeOrg).toHaveBeenCalledWith('cf-1', 'guid-1');
    expect(removeSpace).not.toHaveBeenCalled();
  });

  it('drops the space from the role cache on space delete', () => {
    service.hook(req(spaceEntityType));
    expect(removeSpace).toHaveBeenCalledWith('cf-1', 'guid-1');
    expect(removeOrg).not.toHaveBeenCalled();
  });

  it('no-ops for non-org/space deletes', () => {
    service.hook(req('application'));
    expect(removeOrg).not.toHaveBeenCalled();
    expect(removeSpace).not.toHaveBeenCalled();
  });
});
