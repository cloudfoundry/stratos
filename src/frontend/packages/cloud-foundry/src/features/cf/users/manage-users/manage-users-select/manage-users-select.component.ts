import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, first, map, publishReplay, refCount, switchMap, tap } from 'rxjs/operators';

import { ListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { EntityMonitorFactory } from '../../../../../../../store/src/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../../../store/src/monitors/pagination-monitor.factory';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { UsersRolesSetUsers } from '../../../../../actions/users-roles.actions';
import { CFAppState } from '../../../../../cf-app-state';
import {
  CfSelectUsersListConfigService,
} from '../../../../../shared/components/list/list-types/cf-select-users/cf-select-users-list-config.service';
import { CfUserService } from '../../../../../shared/data-services/cf-user.service';
import { CfUser } from '../../../../../store/types/cf-user.types';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { CfRolesService } from '../cf-roles.service';

@Component({
  selector: 'app-manage-users-select',
  templateUrl: './manage-users-select.component.html',
  styleUrls: ['./manage-users-select.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useFactory: (
        store: Store<CFAppState>,
        activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
        cfUserService: CfUserService,
        paginationMonitorFactory: PaginationMonitorFactory,
        entityMonitorFactory: EntityMonitorFactory) => {
        return new CfSelectUsersListConfigService(
          store,
          activeRouteCfOrgSpace.cfGuid,
          cfUserService,
          activeRouteCfOrgSpace,
          paginationMonitorFactory,
          entityMonitorFactory);
      },
      deps: [Store, ActiveRouteCfOrgSpace, CfUserService, PaginationMonitorFactory, EntityMonitorFactory]
    }
  ],
})
export class UsersRolesSelectComponent {

  selectedUsers$: Observable<CfUser[]>;
  valid$ = new BehaviorSubject<boolean>(false);

  constructor(
    private store: Store<CFAppState>,
    private listConfig: ListConfig<APIResource<CfUser>>,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    public cfRolesService: CfRolesService
  ) {
    this.selectedUsers$ = listConfig.getInitialised().pipe(
      filter(initialised => initialised),
      first(),
      switchMap(() => listConfig.getDataSource().selectedRows$),
      map(users => {
        const arrayUsers = Array.from<APIResource<CfUser>>(users.values()).map(row => row.entity);
        this.valid$.next(!!arrayUsers.length);
        return arrayUsers;
      }),
      publishReplay(1),
      refCount(),
    );
  }

  onNext = () => {
    return this.selectedUsers$.pipe(
      first(),
      tap(users => {
        this.store.dispatch(new UsersRolesSetUsers(this.activeRouteCfOrgSpace.cfGuid, users));
      }),
      map(() => ({ success: true }))
    );
  }
}
