import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { CurrentUserPermissionsService } from '../../../../core/current-user-permissions.service';
import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { AppState } from '../../../../store/app-state';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { UserInviteService } from '../../user-invites/user-invite.service';
import {
  CfUserListConfigService,
} from './../../../../shared/components/list/list-types/cf-users/cf-user-list-config.service';
import { ListConfig } from './../../../../shared/components/list/list.component.types';

@Component({
  selector: 'app-cloud-foundry-users',
  templateUrl: './cloud-foundry-users.component.html',
  styleUrls: ['./cloud-foundry-users.component.scss'],
  providers: [{
    provide: ListConfig,
    useFactory: (
      store: Store<AppState>,
      cfUserService: CfUserService,
      router: Router,
      activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
      userPerms: CurrentUserPermissionsService,
      userInviteService: UserInviteService
    ) => new CfUserListConfigService(store, cfUserService, router, activeRouteCfOrgSpace, userPerms, userInviteService),
    deps: [Store, CfUserService, Router, ActiveRouteCfOrgSpace, CurrentUserPermissionsService, UserInviteService]
  }]
})
export class CloudFoundryUsersComponent { }
