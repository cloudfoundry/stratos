import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { CustomTooltipDirective } from '@stratosui/core';

import { ListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { ListComponent } from '../../../../../../../core/src/shared/components/list/list.component';
import { PageSubNavComponent } from '../../../../../../../core/src/shared/components/page-sub-nav/page-sub-nav.component';
import {
  CfSpacesListConfigService,
} from '../../../../../shared/components/list/list-types/cf-spaces/cf-spaces-list-config.service';
import { CfUserPermissionDirective } from '../../../../../shared/directives/cf-user-permission/cf-user-permission.directive';
import { CfCurrentUserPermissions } from '../../../../../user-permissions/cf-user-permissions-checkers';
import { CloudFoundryEndpointService } from '../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organization.service';

@Component({
  selector: 'app-cloud-foundry-organization-spaces',
  templateUrl: './cloud-foundry-organization-spaces.component.html',
  styleUrls: ['./cloud-foundry-organization-spaces.component.scss'],
  standalone: true,
  imports: [
    RouterModule,
    CustomTooltipDirective,
    ListComponent,
    PageSubNavComponent,
    CfUserPermissionDirective
  ],
  providers: [
    {
      provide: ListConfig,
      useClass: CfSpacesListConfigService
    }
  ]
})
export class CloudFoundryOrganizationSpacesComponent {
  public permsSpaceCreate = CfCurrentUserPermissions.SPACE_CREATE;
  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    public cfOrgService: CloudFoundryOrganizationService
  ) {

  }
}
