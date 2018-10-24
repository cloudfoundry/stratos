import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, first, map, publishReplay, refCount, switchMap, tap } from 'rxjs/operators';

import {
  CfSelectUsersListConfigService,
} from '../../../../../shared/components/list/list-types/cf-select-users/cf-select-users-list-config.service';
import { ListConfig } from '../../../../../shared/components/list/list.component.types';
import { CfUserService } from '../../../../../shared/data-services/cf-user.service';
import { EntityMonitorFactory } from '../../../../../shared/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../shared/monitors/pagination-monitor.factory';
import { UsersRolesSetUsers } from '../../../../../store/actions/users-roles.actions';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { CfUser } from '../../../../../store/types/user.types';
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
        store: Store<AppState>,
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
    private store: Store<AppState>,
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
