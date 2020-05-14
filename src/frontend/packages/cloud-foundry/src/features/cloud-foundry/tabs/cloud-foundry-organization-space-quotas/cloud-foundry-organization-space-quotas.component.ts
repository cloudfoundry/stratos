import { Component } from '@angular/core';
import { Observable } from 'rxjs';

import { ListConfig } from '../../../../../../core/src/shared/components/list/list.component.types';
import { CFUserPermissions } from '../../../../cf-user-permissions.config';
import { CFUserPermissionsService } from '../../../../cf-user-permissions.service';
import {
  CfSpaceQuotasListConfigService,
} from '../../../../shared/components/list/list-types/cf-space-quotas/cf-space-quotas-list-config.service';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';

@Component({
  selector: 'app-cloud-foundry-organization-space-quotas',
  templateUrl: './cloud-foundry-organization-space-quotas.component.html',
  styleUrls: ['./cloud-foundry-organization-space-quotas.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfSpaceQuotasListConfigService
    }
  ]
})
export class CloudFoundryOrganizationSpaceQuotasComponent {
  public canAddQuota$: Observable<boolean>;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    public activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    currentUserPermissionsService: CFUserPermissionsService
  ) {
    const { cfGuid, orgGuid } = this.activeRouteCfOrgSpace;
    this.canAddQuota$ = currentUserPermissionsService.can(CFUserPermissions.SPACE_QUOTA_CREATE, cfGuid, orgGuid);
  }
}
