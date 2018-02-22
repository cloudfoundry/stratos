import { PaginationObservables } from './../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { BaseCF } from './../../features/cloud-foundry/cf-page.types';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { filter, map } from 'rxjs/operators';

import { isOrgAuditor, isOrgBillingManager, isOrgManager, isOrgUser } from '../../features/cloud-foundry/cf.helpers';
import { GetAllUsers } from '../../store/actions/users.actions';
import { AppState } from '../../store/app-state';
import { getPaginationObservables } from '../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../store/types/api.types';
import { CfUser, UserRoleInOrg, UserSchema, IUserPermissionInOrg } from '../../store/types/user.types';
import { PaginationMonitorFactory } from '../monitors/pagination-monitor.factory';



@Injectable()
export class CfUserService {
  public allUsersAction: GetAllUsers;
  public allUsers$: PaginationObservables<APIResource<CfUser>>;

  constructor(
    private store: Store<AppState>,
    public paginationMonitorFactory: PaginationMonitorFactory,
    public baseCF: BaseCF
  ) {
    this.allUsersAction = new GetAllUsers(baseCF.guid);
    this.allUsers$ = getPaginationObservables<APIResource<CfUser>>({
      store: this.store,
      action: this.allUsersAction,
      paginationMonitor: this.paginationMonitorFactory.create(
        this.allUsersAction.paginationKey,
        UserSchema
      )
    });
  }

  getUsers = (endpointGuid: string): Observable<APIResource<CfUser>[]> =>
    this.allUsers$.entities$.pipe(
      filter(p => !!p),
      map(users => users.filter(p => p.entity.cfGuid === endpointGuid)),
      filter(p => p.length > 0)
    )

  getRolesFromUser(user: CfUser): IUserPermissionInOrg[] {
    return user.organizations.map(org => {
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
  ): Observable<UserRoleInOrg> => {
    return this.getUsers(cfGuid).pipe(
      this.getUser(userGuid),
      map(user => {
        return {
          orgManager: isOrgManager(user.entity, spaceGuid),
          billingManager: isOrgBillingManager(user.entity, spaceGuid),
          auditor: isOrgAuditor(user.entity, spaceGuid),
          user: isOrgUser(user.entity, spaceGuid)
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
