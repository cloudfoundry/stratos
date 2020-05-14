import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

import { InternalAppState } from '../../../store/src/app-state';
import { CurrentUserPermissionsChecker } from './current-user-permissions.checker';
import { CurrentUserPermissions, PermissionConfig, permissionConfigs } from './current-user-permissions.config';

// User Permissions Service for Stratos permissions only

@Injectable()
export class CurrentUserPermissionsService {
  private checker: CurrentUserPermissionsChecker;
  constructor(
    store: Store<InternalAppState>
  ) {
    this.checker = new CurrentUserPermissionsChecker(store);
  }
  /**
   * @param action The action we're going to check the user's access to.
   */
  public can(action: CurrentUserPermissions | PermissionConfig): Observable<boolean> {
    const actionConfig = typeof action === 'string' ? permissionConfigs[action] : action;
    const obs$ = this.getCanObservable(actionConfig);
    return obs$ ? obs$.pipe(distinctUntilChanged()) : observableOf(false);
  }

  private getCanObservable(actionConfig: PermissionConfig): Observable<boolean> {
    return this.checker.getSimpleCheck(actionConfig);
  }
}
