import { CurrentUserPermissionsService } from './../../../../core/current-user-permissions.service';
import { Component } from '@angular/core';

import { CfOrgCardComponent } from '../../../../shared/components/list/list-types/cf-orgs/cf-org-card/cf-org-card.component';
import { CfOrgsListConfigService } from '../../../../shared/components/list/list-types/cf-orgs/cf-orgs-list-config.service';
import { ListConfig } from '../../../../shared/components/list/list.component.types';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { CurrentUserPermissions } from '../../../../core/current-user-permissions.config';
import { Observable } from 'rxjs';

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
    this.canAddOrg$ = currentUserPermissionsService.can(CurrentUserPermissions.ORGANIZATION_CREATE, this.cfEndpointService.cfGuid);
  }
  cardComponent = CfOrgCardComponent;
}
