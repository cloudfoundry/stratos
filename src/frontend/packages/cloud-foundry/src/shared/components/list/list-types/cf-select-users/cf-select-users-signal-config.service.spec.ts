import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { firstValueFrom } from 'rxjs';

import { CfSelectUsersSignalConfigService } from './cf-select-users-signal-config.service';
import { CfUsersPagedDataService } from '../../../../data-services/cf-users-paged-data.service';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cf/cf-page.types';

const CNSI = 'cf1';
const P1 = `/pp/v1/cf/users/${CNSI}?per_page=500&page=1`;
const mkUser = (g: string, name: string) => ({
  guid: g,
  username: name,
  cnsiGuid: CNSI,
  orgRoles: [],
  spaceRoles: [],
});

describe('CfSelectUsersSignalConfigService (StUser drain)', () => {
  let svc: CfSelectUsersSignalConfigService;
  let drain: CfUsersPagedDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        CfUsersPagedDataService,
        {
          provide: ActiveRouteCfOrgSpace,
          useValue: { cfGuid: CNSI, orgGuid: '', spaceGuid: '' },
        },
        CfSelectUsersSignalConfigService,
      ],
    });
    svc = TestBed.inject(CfSelectUsersSignalConfigService);
    drain = TestBed.inject(CfUsersPagedDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('exposes StUser rows drained via CfUsersPagedDataService', async () => {
    httpMock.expectOne(P1).flush({
      resources: [mkUser('a', 'alice'), mkUser('b', 'bob')],
      pagination: { totalResults: 2, totalPages: 1 },
    });
    await firstValueFrom(drain.loadUsers(CNSI));

    const rows = svc.users();
    expect(rows.map(u => u.guid)).toEqual(['a', 'b']);
    // Rows are bare StUser objects (no APIResource .entity wrapper).
    expect(rows[0].username).toBe('alice');
    expect(svc.hasLoadedOnce()).toBe(true);
  });

  it('resolveSelected filters the drained rows by guid', async () => {
    httpMock.expectOne(P1).flush({
      resources: [mkUser('a', 'alice'), mkUser('b', 'bob')],
      pagination: { totalResults: 2, totalPages: 1 },
    });
    await firstValueFrom(drain.loadUsers(CNSI));

    svc.selectedKeys.set(new Set(['b']));
    const selected = svc.resolveSelected();
    expect(selected).toHaveLength(1);
    expect(selected[0].guid).toBe('b');
    expect(selected[0].username).toBe('bob');
  });
});
