import { Component , ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { CurrentUserPermissionsService, ListComponent, ListConfig } from '@stratosui/core';
import { CFAppState } from '../../../../../../cf-app-state';
import { CfUsersSpaceRolesListConfigService } from '../../../../../../shared/components/list/list-types/cf-users-org-space-roles/cf-users-space-roles-list-config.service';
import { ActiveRouteCfOrgSpace } from '../../../../cf-page.types';

@Component({
  selector: 'app-space-roles-list-wrapper',
  templateUrl: './space-roles-list-wrapper.component.html',
  styleUrls: ['./space-roles-list-wrapper.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ListComponent
  ],
  providers: [
    {
      provide: ListConfig,
      useFactory: (
        activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
        userPerms: CurrentUserPermissionsService) => {
        return new CfUsersSpaceRolesListConfigService(activeRouteCfOrgSpace.cfGuid, activeRouteCfOrgSpace.spaceGuid, userPerms);
      },
      deps: [ActiveRouteCfOrgSpace, CurrentUserPermissionsService]
    }
  ]
})
export class SpaceRolesListWrapperComponent { }
