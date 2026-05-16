import { Injectable, Signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { Store } from '@stratosui/store';

import { UsersRolesSetChanges } from '../../actions/users-roles.actions';
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
// Reads are signal-out (toSignal-wrapped selectors); writes are a
// thin set of mutation methods that wrap the existing reducer actions
// so consumers don't have to `inject(Store)` for the dispatch leg.
// When the reducer eventually folds into this service, the public
// surface stays put — only the internal `store` bridge goes away.
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

  /**
   * Replace the wizard's pending role-change set. Wraps the
   * {@link UsersRolesSetChanges} reducer action so consumers (the
   * manage-users review step in `CfRolesService`, the remove-user
   * confirm step) don't have to `inject(Store)` for this single
   * dispatch.
   */
  setChanges(changes: CfRoleChange[]): void {
    this.store.dispatch(new UsersRolesSetChanges(changes));
  }
}
