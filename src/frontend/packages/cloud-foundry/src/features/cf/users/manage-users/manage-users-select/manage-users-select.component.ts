import { CommonModule } from '@angular/common';
import { Component, signal , ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Observable } from 'rxjs';
import { filter, first, map, publishReplay, refCount, switchMap, tap } from 'rxjs/operators';

import { EnumerateComponent, ListComponent, ListConfig } from '@stratosui/core';
import { EntityMonitorFactory, PaginationMonitorFactory, type APIResource, type GeneralEntityAppState } from '@stratosui/store';
import { UsersRolesSetUsers } from '../../../../../actions/users-roles.actions';
import type { CFAppState } from '../../../../../cf-app-state';
import {
  CfSelectUsersListConfigService,
} from '../../../../../shared/components/list/list-types/cf-select-users/cf-select-users-list-config.service';
import { CfUserService } from '../../../../../shared/data-services/cf-user.service';
import type { CfUser } from '../../../../../store/types/cf-user.types';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { CfRolesService } from '../cf-roles.service';

@Component({
  selector: 'app-manage-users-select',
  templateUrl: './manage-users-select.component.html',
  styleUrls: ['./manage-users-select.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    EnumerateComponent,
    ListComponent,
  ],
  providers: [
    {
      provide: ListConfig,
      useFactory: (
        store: Store<GeneralEntityAppState>,
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
  valid$ = signal<boolean>(false);

  constructor(
    private store: Store<GeneralEntityAppState>,listConfig: ListConfig<APIResource<CfUser>>,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    public cfRolesService: CfRolesService
  ) {
    this.selectedUsers$ = listConfig.getInitialised().pipe(
      filter(initialised => initialised),
      first(),
      switchMap(() => listConfig.getDataSource().selectedRows$),
      map(users => {
        const arrayUsers = Array.from<APIResource<CfUser>>(users.values()).map(row => row.entity);
        this.valid$.set(!!arrayUsers.length);
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
