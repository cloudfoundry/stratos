import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  ManageUsersSetUsernamesHelper,
} from 'frontend/packages/cloud-foundry/src/features/cloud-foundry/users/manage-users/manage-users-set-usernames/manage-users-set-usernames.component';
import { combineLatest as observableCombineLatest, combineLatest, Observable, of as observableOf, of } from 'rxjs';
import { catchError, filter, first, map, mergeMap, pairwise, switchMap, tap, withLatestFrom } from 'rxjs/operators';

import { ResetPagination } from '../../../../store/src/actions/pagination.actions';
import { entityCatalog } from '../../../../store/src/entity-catalog/entity-catalog';
import { ActionState } from '../../../../store/src/reducers/api-request-reducer/types';
import { selectSessionData } from '../../../../store/src/reducers/auth.reducer';
import { SessionDataEndpoint } from '../../../../store/src/types/auth.types';
import { PaginatedAction } from '../../../../store/src/types/pagination.types';
import { ICFAction, UpdateCfAction } from '../../../../store/src/types/request.types';
import { GET_CURRENT_CF_USER_RELATION, GetCurrentCfUserRelations } from '../../actions/permissions.actions';
import { UsersRolesActions, UsersRolesClearUpdateState, UsersRolesExecuteChanges } from '../../actions/users-roles.actions';
import { AddCfUserRole, ChangeCfUserRole, RemoveCfUserRole } from '../../actions/users.actions';
import { CFAppState } from '../../cf-app-state';
import { organizationEntityType, spaceEntityType } from '../../cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../../cf-types';
import { CfUserService } from '../../shared/data-services/cf-user.service';
import { fetchCfUserRole } from '../../user-permissions/cf-user-roles-fetch';
import { selectCfUsersRoles } from '../selectors/cf-users-roles.selector';
import { OrgUserRoleNames } from '../types/cf-user.types';
import { CfRoleChange, UsersRolesState } from '../types/users-roles.types';


@Injectable()
export class UsersRolesEffects {

  constructor(
    private httpClient: HttpClient,
    private actions$: Actions,
    private store: Store<CFAppState>,
    private cfUserService: CfUserService,
  ) { }

  @Effect() getCurrentUsersPermissions$ = this.actions$.pipe(
    ofType<GetCurrentCfUserRelations>(GET_CURRENT_CF_USER_RELATION),
    map(action => {
      return fetchCfUserRole(this.store, action, this.httpClient).pipe(
        map(() => ({ type: action.actions[1] })),
        catchError(() => [{ type: action.actions[2] }])
      );
    })
  );

  @Effect() clearEntityUpdates$ = this.actions$.pipe(
    ofType<UsersRolesClearUpdateState>(UsersRolesActions.ClearUpdateState),
    mergeMap(action => {
      const actions = [];
      action.changedRoles.forEach(change => {
        const apiAction: ICFAction = {
          guid: change.spaceGuid ? change.spaceGuid : change.orgGuid,
          endpointType: CF_ENDPOINT_TYPE,
          entityType: change.spaceGuid ? spaceEntityType : organizationEntityType,
          updatingKey: ChangeCfUserRole.generateUpdatingKey(change.role, change.userGuid),
          options: null,
          actions: [],
          type: ''
        };
        actions.push(new UpdateCfAction(apiAction, false, ''));
      });
      return actions;
    })
  );

  @Effect() executeUsersRolesChange$ = this.actions$.pipe(
    ofType<UsersRolesExecuteChanges>(UsersRolesActions.ExecuteChanges),
    withLatestFrom(
      this.store.select(selectCfUsersRoles),
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
      for (const change of changes) {
        if (!change.spaceGuid && change.role === OrgUserRoleNames.USER) {
          orgUserChanges.push(change);
        } else {
          nonOrgUserChanges.push(change);
        }
      }

      return this.createAllChanges(
        orgUserChanges,
        cfGuid,
        cfSession,
        action,
        usersRoles,
        nonOrgUserChanges
      ).pipe(
        switchMap(() => {
          if (action.setByUsername) {
            // Ensure that the cfUser entries are updated with the new roles by re-fetching the org and space user lists
            // Normally this is done automatically in the userReducer on ADD_ROLE_SUCCESS/REMOVE_ROLE_SUCCESS, however when setting roles
            // via username the cfUser guids aren't known
            const actions = [];
            const orgListAction = this.cfUserService.createPaginationAction(
              cfSession.user.admin,
              cfGuid,
              action.resetOrgUsers,
            );
            const spaceListAction = this.cfUserService.createPaginationAction(
              cfSession.user.admin,
              cfGuid,
              action.resetOrgUsers,
              action.resetSpaceUsers
            );
            if (cfSession.user.admin) {
              return combineLatest([orgListAction]);
            }
            if (action.resetOrgUsers) {
              actions.push(orgListAction);
            }
            if (action.resetSpaceUsers) {
              actions.push(spaceListAction);
            }
            return combineLatest(actions);
          }
          return of([]);
        }),
        mergeMap((listActions: PaginatedAction[]) => {
          if (listActions && listActions.length) {
            return listActions.map(listAction => new ResetPagination(listAction, listAction.paginationKey));
          }
          return [];
        }),
        catchError(() => {
          // Swallow the error so it doesn't print in the console
          return [];
        })
      );

    }),
  );

  private createAllChanges(
    orgUserChanges: CfRoleChange[],
    cfGuid: string,
    cfSession: SessionDataEndpoint,
    action: UsersRolesExecuteChanges,
    usersRoles: UsersRolesState,
    nonOrgUserChanges: CfRoleChange[]
  ): Observable<any> {
    // Execute changes... depending on if there's any org user change and if that org user change is added (do users change first) or
    // removed (do users change last)
    if (orgUserChanges.length) {
      // Are we adding the org user role (can never add to one user and remove from another)
      if (orgUserChanges[0].add) {

        // Do org user changes first
        return this.executeChanges(cfGuid, cfSession, orgUserChanges, action.setByUsername, usersRoles.usernameOrigin).pipe(
          // Then do all other changes
          mergeMap(() => this.executeChanges(cfGuid, cfSession, nonOrgUserChanges, action.setByUsername, usersRoles.usernameOrigin))
        );
      } else {
        // Do all other changes first
        return this.executeChanges(cfGuid, cfSession, nonOrgUserChanges, action.setByUsername, usersRoles.usernameOrigin).pipe(
          // Then do org user change
          mergeMap(() => this.executeChanges(cfGuid, cfSession, orgUserChanges, action.setByUsername, usersRoles.usernameOrigin))
        );
      }
    } else {
      return this.executeChanges(cfGuid, cfSession, nonOrgUserChanges, action.setByUsername, usersRoles.usernameOrigin);
    }
  }

  private executeChanges(
    cfGuid: string,
    cfSession: SessionDataEndpoint,
    changes: CfRoleChange[],
    setByUsername: boolean,
    usernameOrigin: string): Observable<boolean[]> {
    const observables: Observable<boolean>[] = [];
    changes.forEach(change => {
      const updateConnectedUser = !cfSession.user.admin && change.userGuid === cfSession.user.guid;
      const action = this.createAction(
        cfGuid,
        updateConnectedUser,
        change,
        setByUsername ? ManageUsersSetUsernamesHelper.usernameFromGuid(change.userGuid) : null,
        usernameOrigin
      );
      this.store.dispatch(action);
      observables.push(this.createActionObs(action));
    });
    const allObservables = observables.length === 0 ? observableOf([true]) : observableCombineLatest(...observables);
    return allObservables.pipe(
      first()
    );
  }

  private createAction(
    cfGuid: string,
    updateConnectedUser: boolean,
    change: CfRoleChange,
    username: string,
    usernameOrigin: string
  ): ChangeCfUserRole {
    const isSpace = !!change.spaceGuid;
    const entityGuid = isSpace ? change.spaceGuid : change.orgGuid;
    return change.add ?
      new AddCfUserRole(
        cfGuid,
        change.userGuid,
        entityGuid,
        change.role,
        isSpace,
        updateConnectedUser,
        change.orgGuid,
        username,
        usernameOrigin
      ) :
      new RemoveCfUserRole(
        cfGuid,
        change.userGuid,
        entityGuid,
        change.role,
        isSpace,
        updateConnectedUser,
        change.orgGuid,
        username,
        usernameOrigin
      );
  }

  private createActionObs(action: ChangeCfUserRole): Observable<any> {
    return entityCatalog.getEntity(action)
      .store
      .getEntityMonitor(action.guid)
      .getUpdatingSection(action.updatingKey).pipe(
        pairwise(),
        filter(([oldUpdate, newUpdate]) => !!oldUpdate.busy && !newUpdate.busy),
        map(([, newUpdate]) => newUpdate),
        tap((update: ActionState) => {
          if (update.error) {
            // Ensure we throw an error such that any subsequent requests fail
            throw new Error(`Failed: ${update.message}`);
          }
        })
      );
  }
}
