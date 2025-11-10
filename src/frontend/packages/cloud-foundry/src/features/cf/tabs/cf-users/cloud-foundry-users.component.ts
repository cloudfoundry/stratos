import { Component , ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { CurrentUserPermissionsService } from '@stratosui/core';
import { ListConfig, ListComponent, NoContentMessageComponent } from '@stratosui/core';
import { CFAppState } from '../../../../cf-app-state';
import { CfUserListConfigService } from '../../../../shared/components/list/list-types/cf-users/cf-user-list-config.service';
import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';

@Component({
  selector: 'app-cloud-foundry-users',
  templateUrl: './cloud-foundry-users.component.html',
  styleUrls: ['./cloud-foundry-users.component.scss'],
  providers: [{
    provide: ListConfig,
    useFactory: (
      store: Store<CFAppState>,
      cfUserService: CfUserService,
      router: Router,
      activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
      userPerms: CurrentUserPermissionsService,
    ) => new CfUserListConfigService(store, cfUserService, router, activeRouteCfOrgSpace, userPerms),
    deps: [Store, CfUserService, Router, ActiveRouteCfOrgSpace, CurrentUserPermissionsService]
  }],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ListComponent,
    NoContentMessageComponent
  ]
})
export class CloudFoundryUsersComponent { }
