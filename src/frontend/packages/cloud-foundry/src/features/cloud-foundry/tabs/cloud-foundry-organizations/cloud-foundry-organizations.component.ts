import { Component } from '@angular/core';
import { Observable } from 'rxjs';

import { ListConfig } from '../../../../../../core/src/shared/components/list/list.component.types';
import { CFUserPermissions } from '../../../../cf-user-permissions.config';
import { CFUserPermissionsService } from '../../../../cf-user-permissions.service';
import { CfOrgCardComponent } from '../../../../shared/components/list/list-types/cf-orgs/cf-org-card/cf-org-card.component';
import { CfOrgsListConfigService } from '../../../../shared/components/list/list-types/cf-orgs/cf-orgs-list-config.service';
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
    currentUserPermissionsService: CFUserPermissionsService
  ) {
    this.canAddOrg$ = currentUserPermissionsService.can(CFUserPermissions.ORGANIZATION_CREATE, this.cfEndpointService.cfGuid);
  }
  cardComponent = CfOrgCardComponent;
}
