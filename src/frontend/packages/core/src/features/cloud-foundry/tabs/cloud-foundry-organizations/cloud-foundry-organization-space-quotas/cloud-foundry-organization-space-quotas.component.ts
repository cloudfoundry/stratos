import { Component } from '@angular/core';
import { Observable } from 'rxjs';

import { CurrentUserPermissions } from '../../../../../core/current-user-permissions.config';
import {
  CfSpaceQuotasListConfigService,
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
      useClass: CfSpaceQuotasListConfigService
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
    const { cfGuid, orgGuid } = this.activeRouteCfOrgSpace;
    this.canAddQuota$ = currentUserPermissionsService.can(CurrentUserPermissions.SPACE_QUOTA_CREATE, cfGuid, orgGuid);
  }
}
