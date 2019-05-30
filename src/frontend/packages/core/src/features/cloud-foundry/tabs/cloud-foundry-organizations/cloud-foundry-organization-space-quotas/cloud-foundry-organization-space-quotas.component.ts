import { Component } from '@angular/core';
import { Observable } from 'rxjs';

import { CurrentUserPermissions } from '../../../../../core/current-user-permissions.config';
import {
  CfSpaceQuotaCardComponent,
} from '../../../../../shared/components/list/list-types/cf-space-quotas/cf-space-quota-card/cf-space-quota-card.component';
import {
  CfOrgSpaceQuotasListConfigService,
} from '../../../../../shared/components/list/list-types/cf-space-quotas/cf-space-quotas-list-config.service';
import { ListConfig } from '../../../../../shared/components/list/list.component.types';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { CloudFoundryEndpointService } from '../../../services/cloud-foundry-endpoint.service';
import { CurrentUserPermissionsService } from './../../../../../core/current-user-permissions.service';

@Component({
  selector: 'app-cloud-foundry-organization-space-quotas',
  templateUrl: './cloud-foundry-organization-space-quotas.component.html',
  styleUrls: ['./cloud-foundry-organization-space-quotas.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfOrgSpaceQuotasListConfigService
    }
  ]
})
export class CloudFoundryOrganizationSpaceQuotasComponent {
  public canAddQuota$: Observable<boolean>;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    public activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    currentUserPermissionsService: CurrentUserPermissionsService
  ) {
    this.canAddQuota$ = currentUserPermissionsService.can(CurrentUserPermissions.ORGANIZATION_CREATE, this.cfEndpointService.cfGuid);
  }
  cardComponent = CfSpaceQuotaCardComponent;
}
