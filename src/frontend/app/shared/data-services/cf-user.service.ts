import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { filter, map, shareReplay } from 'rxjs/operators';

import {
  isOrgAuditor,
  isOrgBillingManager,
  isOrgManager,
  isOrgUser,
  isSpaceAuditor,
  isSpaceDeveloper,
  isSpaceManager,
} from '../../features/cloud-foundry/cf.helpers';
import { GetAllUsers } from '../../store/actions/users.actions';
import { AppState } from '../../store/app-state';
import { cfUserSchemaKey, entityFactory, endpointSchemaKey } from '../../store/helpers/entity-factory';
import { getPaginationObservables, PaginationObservables } from '../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../store/types/api.types';
import { CfUser, IUserPermissionInOrg, UserRoleInOrg, UserRoleInSpace } from '../../store/types/user.types';
import { PaginationMonitorFactory } from '../monitors/pagination-monitor.factory';
import { ActiveRouteCfOrgSpace } from './../../features/cloud-foundry/cf-page.types';
import { createEntityRelationPaginationKey } from '../../store/helpers/entity-relations.types';

@Injectable()
export class CfUserService {
  public allUsersAction: GetAllUsers;
  public allUsers$: PaginationObservables<APIResource<CfUser>>;

  constructor(
    private store: Store<AppState>,
    public paginationMonitorFactory: PaginationMonitorFactory,
    public activeRouteCfOrgSpace: ActiveRouteCfOrgSpace
  ) {
    // FIXME: This action will fail if the CF user is not a CF admin
    this.allUsersAction = new GetAllUsers(createEntityRelationPaginationKey(endpointSchemaKey, activeRouteCfOrgSpace.cfGuid));
    this.allUsers$ = getPaginationObservables<APIResource<CfUser>>({
      store: this.store,
      action: this.allUsersAction,
      paginationMonitor: this.paginationMonitorFactory.create(
        this.allUsersAction.paginationKey,
        entityFactory(cfUserSchemaKey)
      )
    });
  }

  getUsers = (endpointGuid: string): Observable<APIResource<CfUser>[]> =>
    this.allUsers$.entities$.pipe(
      filter(p => !!p),
      map(users => users.filter(p => p.entity.cfGuid === endpointGuid)),
      filter(p => p.length > 0),
      shareReplay(1),
    )

  getRolesFromUser(user: CfUser, type: 'organizations' | 'spaces' = 'organizations'): IUserPermissionInOrg[] {
    return user[type].map(org => {
      const orgGuid = org.metadata.guid;
      return {
        orgName: org.entity.name as string,
        orgGuid: org.metadata.guid,
        permissions: {
          orgManager: isOrgManager(user, orgGuid),
          billingManager: isOrgBillingManager(user, orgGuid),
          auditor: isOrgAuditor(user, orgGuid),
          user: isOrgUser(user, orgGuid)
        }
      };
    });
  }

  getUserRoleInOrg = (
    userGuid: string,
    orgGuid: string,
    cfGuid: string
  ): Observable<UserRoleInOrg> => {
    return this.getUsers(cfGuid).pipe(
      this.getUser(userGuid),
      map(user => {
        return {
          orgManager: isOrgManager(user.entity, orgGuid),
          billingManager: isOrgBillingManager(user.entity, orgGuid),
          auditor: isOrgAuditor(user.entity, orgGuid),
          user: isOrgUser(user.entity, orgGuid)
        };
      })
    );
  }

  getUserRoleInSpace = (
    userGuid: string,
    spaceGuid: string,
    cfGuid: string
  ): Observable<UserRoleInSpace> => {
    return this.getUsers(cfGuid).pipe(
      this.getUser(userGuid),
      map(user => {
        return {
          manager: isSpaceManager(user.entity, spaceGuid),
          auditor: isSpaceAuditor(user.entity, spaceGuid),
          developer: isSpaceDeveloper(user.entity, spaceGuid)
        };
      })
    );
  }

  private getUser(userGuid: string): (source: Observable<APIResource<CfUser>[]>) => Observable<APIResource<CfUser>> {
    return map(users => {
      return users.filter(o => o.entity.guid === userGuid)[0];
    });
  }
}
