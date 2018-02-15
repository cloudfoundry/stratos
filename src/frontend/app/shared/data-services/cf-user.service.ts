import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

import { AppState } from '../../store/app-state';
import {
  getPaginationObservables,
  getCurrentPageRequestInfo
} from '../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { endpointsRegisteredEntitiesSelector } from '../../store/selectors/endpoint.selectors';
import { EndpointModel } from '../../store/types/endpoint.types';
import { PaginationMonitorFactory } from '../monitors/pagination-monitor.factory';
import { UserSchema, GetAllUsers } from '../../store/actions/users.actions';
import { APIResource } from '../../store/types/api.types';
import { map, filter, tap } from 'rxjs/operators';
import { CfUser, UserRoleInOrg } from '../../store/types/user.types';
import {
  isManager,
  isBillingManager,
  isAuditor,
  isUser
} from '../../features/cloud-foundry/cf.helpers';
@Injectable()
export class CfUserService {
  public static EndpointUserService = 'endpointUsersService';

  public allUsersAction = new GetAllUsers(CfUserService.EndpointUserService);

  public allUsers$ = getPaginationObservables<APIResource>({
    store: this.store,
    action: this.allUsersAction,
    paginationMonitor: this.paginationMonitorFactory.create(
      this.allUsersAction.paginationKey,
      UserSchema
    )
  });

  constructor(
    private store: Store<AppState>,
    public paginationMonitorFactory: PaginationMonitorFactory
  ) {}

  getUsers = (endpointGuid: string): Observable<APIResource<CfUser>[]> =>
    this.allUsers$.entities$.pipe(
      filter(p => !!p),
      map(users => users.filter(p => p.entity.cfGuid === endpointGuid)),
      filter(p => p.length > 0)

    )

  getUserRoleInOrg = (
    userGuid: string,
    orgGuid: string,
    cfGuid: string
  ): Observable<UserRoleInOrg> => {
    return this.getUsers(cfGuid).pipe(
      tap(o => console.log(o)),
      map(users => {
        return users.filter(o => o.entity.guid === userGuid)[0];
      }),
      map(user => {
        return {
          orgManager: isManager(user.entity, orgGuid),
          billingManager: isBillingManager(user.entity, orgGuid),
          auditor: isAuditor(user.entity, orgGuid),
          user: isUser(user.entity, orgGuid)
        };
      })
    );
  }
}
