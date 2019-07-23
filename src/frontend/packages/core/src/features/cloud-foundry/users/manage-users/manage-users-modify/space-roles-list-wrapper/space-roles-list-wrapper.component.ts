import { Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../../../../cloud-foundry/src/cf-app-state';
import { CurrentUserPermissionsService } from '../../../../../../core/current-user-permissions.service';
import {
  CfUsersSpaceRolesListConfigService,
} from '../../../../../../shared/components/list/list-types/cf-users-org-space-roles/cf-users-space-roles-list-config.service';
import { ListConfig } from '../../../../../../shared/components/list/list.component.types';
import { ActiveRouteCfOrgSpace } from '../../../../cf-page.types';

@Component({
  selector: 'app-space-roles-list-wrapper',
  templateUrl: './space-roles-list-wrapper.component.html',
  styleUrls: ['./space-roles-list-wrapper.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useFactory: (
        store: Store<CFAppState>,
        activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
        userPerms: CurrentUserPermissionsService) => {
        return new CfUsersSpaceRolesListConfigService(store, activeRouteCfOrgSpace.cfGuid, activeRouteCfOrgSpace.spaceGuid, userPerms);
      },
      deps: [Store, ActiveRouteCfOrgSpace, CurrentUserPermissionsService]
    }
  ]
})
export class SpaceRolesListWrapperComponent { }
