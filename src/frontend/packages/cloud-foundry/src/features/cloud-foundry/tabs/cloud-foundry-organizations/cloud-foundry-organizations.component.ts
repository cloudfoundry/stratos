import { Component } from '@angular/core';
import { Observable } from 'rxjs';

import { CurrentUserPermissionsService } from '../../../../../../core/src/core/permissions/current-user-permissions.service';
import { ListConfig } from '../../../../../../core/src/shared/components/list/list.component.types';
import { CfOrgCardComponent } from '../../../../shared/components/list/list-types/cf-orgs/cf-org-card/cf-org-card.component';
import { CfOrgsListConfigService } from '../../../../shared/components/list/list-types/cf-orgs/cf-orgs-list-config.service';
import { CfCurrentUserPermissions } from '../../../../user-permissions/cf-user-permissions-checkers';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';

@Component({
  selector: 'app-cloud-foundry-organizations',
  templateUrl: './cloud-foundry-organizations.component.html',
  styleUrls: ['./cloud-foundry-organizations.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfOrgsListConfigService
    }
  ]
})
export class CloudFoundryOrganizationsComponent {
  public canAddOrg$: Observable<boolean>;
  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    currentUserPermissionsService: CurrentUserPermissionsService
  ) {
    this.canAddOrg$ = currentUserPermissionsService.can(CfCurrentUserPermissions.ORGANIZATION_CREATE, this.cfEndpointService.cfGuid);
  }
  cardComponent = CfOrgCardComponent;
}
