import { Injectable, Signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { Store } from '@stratosui/store';

import { CFAppState } from '../../cf-app-state';
import {
  selectCfUsersIsRemove,
  selectCfUsersIsSetByUsername,
  selectCfUsersRoles,
  selectCfUsersRolesChangedRoles,
  selectCfUsersRolesCf,
  selectCfUsersRolesOrgGuid,
  selectCfUsersRolesPicked,
  selectCfUsersRolesRoles,
} from '../../store/selectors/cf-users-roles.selector';
import { CfRoleChange, UsersRolesState } from '../../store/types/users-roles.types';
import { CfUser, IUserPermissionInOrg } from '../../store/types/cf-user.types';

// Signal-native bridge for the manageUsersRoles wizard slice. Wraps
// each compose-style selector in toSignal so the manage-users wizard
// (cf-roles.service, manage-users{,-modify,-confirm}, remove-user,
// cf-users-space-roles-list-config, table-cell-select-org,
// cf-role-checkbox) can drop their `store.select(selectCfUsers...)`
// calls without waiting for the underlying NgRx reducer to migrate.
//
// The wizard still mutates state through reducer actions; this service
// is read-only on top. Each accessor is a stable Signal wired through
// toSignal once at construction.
@Injectable({ providedIn: 'root' })
export class CfUsersRolesDataService {
  private readonly store = inject<Store<CFAppState>>(Store);

  readonly state: Signal<UsersRolesState | undefined> = toSignal(
    this.store.select(selectCfUsersRoles),
    { initialValue: undefined },
  );

  readonly cfGuid: Signal<string | undefined> = toSignal(
    this.store.select(selectCfUsersRolesCf),
    { initialValue: undefined },
  );

  readonly users: Signal<CfUser[]> = toSignal(
    this.store.select(selectCfUsersRolesPicked),
    { initialValue: [] as CfUser[] },
  );

  readonly newRoles: Signal<IUserPermissionInOrg | undefined> = toSignal(
    this.store.select(selectCfUsersRolesRoles),
    { initialValue: undefined },
  );

  readonly orgGuid: Signal<string | undefined> = toSignal(
    this.store.select(selectCfUsersRolesOrgGuid),
    { initialValue: undefined },
  );

  readonly changedRoles: Signal<CfRoleChange[]> = toSignal(
    this.store.select(selectCfUsersRolesChangedRoles),
    { initialValue: [] as CfRoleChange[] },
  );

  readonly isRemove: Signal<boolean | undefined> = toSignal(
    this.store.select(selectCfUsersIsRemove),
    { initialValue: undefined },
  );

  readonly isSetByUsername: Signal<boolean | undefined> = toSignal(
    this.store.select(selectCfUsersIsSetByUsername),
    { initialValue: undefined },
  );
}
