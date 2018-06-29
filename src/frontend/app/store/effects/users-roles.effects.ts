import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { combineLatest as observableCombineLatest, Observable, of as observableOf } from 'rxjs';
import { filter, first, map, mergeMap, pairwise, withLatestFrom } from 'rxjs/operators';

import { EntityMonitor } from '../../shared/monitors/entity-monitor';
import { UsersRolesActions, UsersRolesClearUpdateState, UsersRolesExecuteChanges } from '../actions/users-roles.actions';
import { AddUserRole, ChangeUserRole, RemoveUserRole } from '../actions/users.actions';
import { AppState } from '../app-state';
import { entityFactory, organizationSchemaKey, spaceSchemaKey } from '../helpers/entity-factory';
import { selectSessionData } from '../reducers/auth.reducer';
import { selectUsersRoles } from '../selectors/users-roles.selector';
import { SessionDataEndpoint } from '../types/auth.types';
import { ICFAction, UpdateCfAction } from '../types/request.types';
import { OrgUserRoleNames } from '../types/user.types';
import { CfRoleChange } from '../types/users-roles.types';


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
          updatingKey: ChangeUserRole.generateUpdatingKey(change.role, change.userGuid),
          options: null,
          actions: []
        } as ICFAction;

        actions.push(new UpdateCfAction(apiAction, false, ''));
      });
      return actions;
    })
  );

  @Effect() executeUsersRolesChange$ = this.actions$.ofType<UsersRolesExecuteChanges>(UsersRolesActions.ExecuteChanges).pipe(
    withLatestFrom(
      this.store.select(selectUsersRoles),
      this.store.select(selectSessionData())
    ),
    mergeMap(([action, usersRoles, sessionData]) => {
      // If the user is adding the org user role then that needs to execute and succeed first, otherwise the other changes will fail
      // Conversely if the org user role is being removed all other changes need to execute first
      // Note - we should never be in the state where a user is adding space/org roles and removing org user. We could safeguard against
      // this here, however the UX should have already ensured this

      const cfGuid = usersRoles.cfGuid;
      const cfSession = sessionData.endpoints.cf[cfGuid];
      const changes = [...usersRoles.changedRoles];

      // Split changes into `org user` and `other`
      const orgUserChanges: CfRoleChange[] = [];
      const nonOrgUserChanges: CfRoleChange[] = [];
      for (let i = 0; i < changes.length; i++) {
        const change = changes[i];
        if (!change.spaceGuid && change.role === OrgUserRoleNames.USER) {
          orgUserChanges.push(change);
        } else {
          nonOrgUserChanges.push(change);
        }
      }

      // Execute changes... depending on if there's any org user change and if that org user change is added (do users change first) or
      // removed (do users change last)
      if (orgUserChanges.length) {
        // Are we adding the org user role (can never add to one user and remove from another)
        if (orgUserChanges[0].add) {

          // Do org user changes first
          return this.executeChanges(cfGuid, cfSession, orgUserChanges).pipe(
            // Then do all other changes
            mergeMap(() => this.executeChanges(cfGuid, cfSession, nonOrgUserChanges))
          );
        } else {
          // Do all other changes first
          return this.executeChanges(cfGuid, cfSession, nonOrgUserChanges).pipe(
            // Then do org user change
            mergeMap(() => this.executeChanges(cfGuid, cfSession, orgUserChanges))
          );
        }
      } else {
        return this.executeChanges(cfGuid, cfSession, nonOrgUserChanges);
      }
    }),
    mergeMap(() => [])
  );


  private executeChanges(cfGuid: string, cfSession: SessionDataEndpoint, changes: CfRoleChange[]): Observable<boolean[]> {
    const observables: Observable<boolean>[] = [];
    changes.forEach(change => {
      const updateConnectedUser = !cfSession.user.admin && change.userGuid === cfSession.user.guid;
      const action = this.createAction(cfGuid, updateConnectedUser, change);
      this.store.dispatch(action);
      observables.push(this.createActionObs(action));
    });
    const allObservables = observables.length === 0 ? observableOf([true]) : observableCombineLatest(...observables);
    return allObservables.pipe(
      first()
    );
  }

  private createAction(cfGuid: string, updateConnectedUser: boolean, change: CfRoleChange): ChangeUserRole {
    const isSpace = !!change.spaceGuid;
    const entityGuid = isSpace ? change.spaceGuid : change.orgGuid;
    return change.add ?
      new AddUserRole(cfGuid, change.userGuid, entityGuid, change.role, isSpace, updateConnectedUser, change.orgGuid) :
      new RemoveUserRole(cfGuid, change.userGuid, entityGuid, change.role, isSpace, updateConnectedUser, change.orgGuid);
  }

  private createActionObs(action: ChangeUserRole): Observable<boolean> {
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
