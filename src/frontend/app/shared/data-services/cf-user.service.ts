import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { filter, map, shareReplay, first } from 'rxjs/operators';

import { IOrganization, ISpace } from '../../core/cf-api.types';
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
import { cfUserSchemaKey, endpointSchemaKey, entityFactory } from '../../store/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../store/helpers/entity-relations.types';
import {
  getPaginationObservables,
  PaginationObservables,
} from '../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../store/types/api.types';
import { CfUser, IUserPermissionInOrg, UserRoleInOrg, UserRoleInSpace } from '../../store/types/user.types';
import { PaginationMonitorFactory } from '../monitors/pagination-monitor.factory';
import { ActiveRouteCfOrgSpace } from './../../features/cloud-foundry/cf-page.types';

@Injectable()
export class CfUserService {
  public allUsersAction: GetAllUsers;
  private allUsers$: PaginationObservables<APIResource<CfUser>>;

  constructor(
    private store: Store<AppState>,
    public paginationMonitorFactory: PaginationMonitorFactory,
    public activeRouteCfOrgSpace: ActiveRouteCfOrgSpace
  ) {
    // See issue #1741
    this.allUsersAction = new GetAllUsers(
      createEntityRelationPaginationKey(endpointSchemaKey, activeRouteCfOrgSpace.cfGuid),
      activeRouteCfOrgSpace.cfGuid
    );
  }

  getUsers = (endpointGuid: string): Observable<APIResource<CfUser>[]> =>
    this.getAllUsers().entities$.pipe(
      filter(p => !!p),
      map(users => users.filter(p => p.entity.cfGuid === endpointGuid)),
      filter(p => p.length > 0),
      shareReplay(1),
    )

  getRolesFromUser(user: CfUser, type: 'organizations' | 'spaces' = 'organizations'): IUserPermissionInOrg[] {
    const role = user[type] as APIResource<IOrganization | ISpace>[];
    return role.map(org => {
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
      }),
      first()
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

  private getAllUsers(): PaginationObservables<APIResource<CfUser>> {
    if (!this.allUsers$) {
      this.allUsers$ = getPaginationObservables<APIResource<CfUser>>({
        store: this.store,
        action: this.allUsersAction,
        paginationMonitor: this.paginationMonitorFactory.create(
          this.allUsersAction.paginationKey,
          entityFactory(cfUserSchemaKey)
        )
      });
    }
    return this.allUsers$;
  }

  private getUser(userGuid: string): (source: Observable<APIResource<CfUser>[]>) => Observable<APIResource<CfUser>> {
    return map(users => {
      return users.filter(o => o.metadata.guid === userGuid)[0];
    });
  }
}
