import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { filter, first, map, mergeMap, pairwise, withLatestFrom } from 'rxjs/operators';

import { EntityMonitor } from '../../shared/monitors/entity-monitor';
import { UsersRolesActions, UsersRolesExecuteChanges, UsersRolesClear, UsersRolesClearUpdateState } from '../actions/users-roles.actions';
import { AddUserPermission, ChangeUserPermission, RemoveUserPermission } from '../actions/users.actions';
import { AppState } from '../app-state';
import { entityFactory, spaceSchemaKey, organizationSchemaKey } from '../helpers/entity-factory';
import { selectUsersRoles } from '../selectors/users-roles.selector';
import { CfRoleChange } from '../types/users-roles.types';
import { UpdateCfAction, ICFAction } from '../types/request.types';
import { OrgUserRoleNames } from '../types/user.types';

@Injectable()
export class UsersRolesEffects {

  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
  ) { }

  @Effect() clearEntityUpdates$ = this.actions$.ofType<UsersRolesClearUpdateState>(UsersRolesActions.ClearUpdateState).pipe(
    mergeMap(action => {
      const actions = [];
      action.changedRoles.forEach(change => {
        const apiAction = {
          guid: change.spaceGuid ? change.spaceGuid : change.orgGuid,
          entityKey: change.spaceGuid ? spaceSchemaKey : organizationSchemaKey,
          updatingKey: ChangeUserPermission.generateUpdatingKey(change.role, change.userGuid),
          options: null,
          actions: []
        } as ICFAction;

        actions.push(new UpdateCfAction(apiAction, false, ''));
      });
      return actions;
    })
  );

  @Effect() executeUsersRolesChange$ = this.actions$.ofType<UsersRolesExecuteChanges>(UsersRolesActions.ExecuteChanges).pipe(
    withLatestFrom(this.store.select(selectUsersRoles)),
    mergeMap(([action, usersRoles]) => {
      // If the user is adding the org user role then that needs to execute and succeed first, otherwise the other changes will fail
      // Conversely if the org user role is being removed all other changes need to execute first
      // Note - we should never be in the state where a user is adding space/org roles and removing org user. We could safeguard against
      // this here, however the UX should have already ensured this

      const cfGuid = usersRoles.cfGuid;
      const changes = [...usersRoles.changedRoles];

      // First discover if there's a change to the org user role
      const orgUserChangeIndex = changes.findIndex(change => {
        return !change.spaceGuid && change.role === OrgUserRoleNames.USER;
      });
      const orgUserChange = changes[orgUserChangeIndex];
      if (orgUserChangeIndex >= 0) {
        changes.splice(orgUserChangeIndex, 1);
      }
      const nonOrgUserChanges = changes;

      if (orgUserChange) {
        if (orgUserChange.add) {
          // Do org user change first
          return this.executeChanges(cfGuid, [orgUserChange]).pipe(
            // Then do all other changes
            mergeMap(() => this.executeChanges(cfGuid, nonOrgUserChanges))
          );
        } else {
          // Do all other changes first
          return this.executeChanges(cfGuid, nonOrgUserChanges).pipe(
            // Then do org user change
            mergeMap(() => this.executeChanges(cfGuid, [orgUserChange]))
          );
        }
      } else {
        return this.executeChanges(cfGuid, nonOrgUserChanges);
      }
    }),
    mergeMap(() => [])
  );


  private executeChanges(cfGuid: string, changes: CfRoleChange[]): Observable<boolean[]> {
    const observables: Observable<boolean>[] = [];
    changes.forEach(change => {
      const action = this.createAction(cfGuid, change);
      this.store.dispatch(action);
      // const obs = this.createActionObs(action);
      observables.push(this.createActionObs(action));
    });
    return Observable.combineLatest(...observables).pipe(
      first()
    );
  }

  private createAction(cfGuid: string, change: CfRoleChange): ChangeUserPermission {
    const isSpace = !!change.spaceGuid;
    const entityGuid = isSpace ? change.spaceGuid : change.orgGuid;
    return change.add ?
      new AddUserPermission(cfGuid, change.userGuid, entityGuid, change.role, isSpace) :
      new RemoveUserPermission(cfGuid, change.userGuid, entityGuid, change.role, isSpace);
  }

  private createActionObs(action: ChangeUserPermission): Observable<boolean> {
    return new EntityMonitor(
      this.store,
      action.guid,
      action.entityKey,
      entityFactory(action.entityKey)
    ).getUpdatingSection(action.updatingKey).pipe(
      map(update => update.busy),
      pairwise(),
      filter(([oldBusy, newBusy]) => !!oldBusy && !newBusy),
      map(([oldBusy, newBusy]) => newBusy)
    );
  }
}
