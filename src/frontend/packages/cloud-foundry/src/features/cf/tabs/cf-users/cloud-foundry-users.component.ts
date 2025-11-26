import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';

import { Store } from '@ngrx/store'
import type { GeneralEntityAppState } from '@stratosui/store';;

import {
  CurrentUserPermissionsService,
  ListComponent,
  ListConfig,
  NoContentMessageComponent,
} from '@stratosui/core';

import { CfUserListConfigService } from '../../../../shared/components/list/list-types/cf-users/cf-user-list-config.service';
import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';

@Component({
  selector: 'app-cloud-foundry-users',
  templateUrl: './cloud-foundry-users.component.html',
  styleUrls: ['./cloud-foundry-users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ListComponent,
    NoContentMessageComponent,
  ],
  providers: [
    {
      provide: ListConfig,
      useFactory: (
        store: Store<GeneralEntityAppState>,
        cfUserService: CfUserService,
        router: Router,
        activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
        userPerms: CurrentUserPermissionsService,
      ) => new CfUserListConfigService(store, cfUserService, router, activeRouteCfOrgSpace, userPerms),
      deps: [Store, CfUserService, Router, ActiveRouteCfOrgSpace, CurrentUserPermissionsService],
    },
  ],
})
export class CloudFoundryUsersComponent { }
