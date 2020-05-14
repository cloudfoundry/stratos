import { Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { ListConfig } from '../../../../../../../../core/src/shared/components/list/list.component.types';
import { CFAppState } from '../../../../../../cf-app-state';
import { CFUserPermissionsService } from '../../../../../../cf-user-permissions.service';
import {
  CfUsersSpaceRolesListConfigService,
} from '../../../../../../shared/components/list/list-types/cf-users-org-space-roles/cf-users-space-roles-list-config.service';
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
        userPerms: CFUserPermissionsService) => {
        return new CfUsersSpaceRolesListConfigService(store, activeRouteCfOrgSpace.cfGuid, activeRouteCfOrgSpace.spaceGuid, userPerms);
      },
      deps: [Store, ActiveRouteCfOrgSpace, CFUserPermissionsService]
    }
  ]
})
export class SpaceRolesListWrapperComponent { }
