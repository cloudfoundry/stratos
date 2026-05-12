import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { describe, expect, it, beforeEach } from 'vitest';

import { CfUser, IUserPermissionInOrg } from '../../store/types/cf-user.types';
import { CfRoleChange, UsersRolesState } from '../../store/types/users-roles.types';
import { CfUsersRolesDataService } from './cf-users-roles-data.service';

const newRoles: IUserPermissionInOrg = {
  orgGuid: 'org-1',
  orgName: 'Org 1',
  permissions: {} as any,
  spaces: {} as any,
};

const userA = { guid: 'u-a', username: 'alice' } as unknown as CfUser;

const change: CfRoleChange = {
  userGuid: 'u-a',
  orgGuid: 'org-1',
  add: true,
  role: 'managers' as any,
  orgName: 'Org 1',
};

const fullState: UsersRolesState = {
  cfGuid: 'cf-1',
  users: [userA],
  newRoles,
  changedRoles: [change],
  isRemove: false,
  isSetByUsername: true,
};

function stateWith(roles: Partial<UsersRolesState>): unknown {
  return {
    manageUsersRoles: { ...fullState, ...roles },
  };
}

describe('CfUsersRolesDataService', () => {
  let svc: CfUsersRolesDataService;
  let store: MockStore;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideMockStore({ initialState: stateWith({}) }),
        CfUsersRolesDataService,
      ],
    });
    store = TestBed.inject(MockStore);
    svc = TestBed.inject(CfUsersRolesDataService);
  });

  it('exposes the wizard slice fields as signals', () => {
    expect(svc.cfGuid()).toBe('cf-1');
    expect(svc.users().map(u => u.guid)).toEqual(['u-a']);
    expect(svc.newRoles()).toEqual(newRoles);
    expect(svc.orgGuid()).toBe('org-1');
    expect(svc.changedRoles()).toEqual([change]);
    expect(svc.isRemove()).toBe(false);
    expect(svc.isSetByUsername()).toBe(true);
  });

  it('reflects state changes through the signal pipeline', () => {
    store.setState(stateWith({ cfGuid: 'cf-2', isRemove: true, isSetByUsername: false }));

    expect(svc.cfGuid()).toBe('cf-2');
    expect(svc.isRemove()).toBe(true);
    expect(svc.isSetByUsername()).toBe(false);
  });
});
