import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { QUOTA_FROM_LIST } from '../../../shared/components/list/list-types/cf-quotas/cf-quotas-list-config.service';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { QUOTA_SPACE_GUID } from '../space-quota-definition/space-quota-definition.component';

@Component({
  selector: 'app-edit-space-quota',
  templateUrl: './edit-space-quota.component.html',
  styleUrls: ['./edit-space-quota.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ]
})
export class EditSpaceQuotaComponent {
  cfSpaceQuotaUrl: string;
  constructor(
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    activatedRoute: ActivatedRoute
  ) {
    const cfId = activeRouteCfOrgSpace.cfGuid;
    const orgId = activeRouteCfOrgSpace.orgGuid;
    const spaceQuotaId = activatedRoute.snapshot.params.quotaId;
    const spaceGuid = activatedRoute.snapshot.queryParams[QUOTA_SPACE_GUID];
    const fromList = activatedRoute.snapshot.queryParams[QUOTA_FROM_LIST];

    if (spaceGuid) {
      this.cfSpaceQuotaUrl = `/cloud-foundry/${cfId}/organizations/${orgId}/spaces/${spaceGuid}/space-quota`;
    } else if (fromList) {
      this.cfSpaceQuotaUrl = `/cloud-foundry/${cfId}/organizations/${orgId}/space-quota-definitions`;
    } else {
      this.cfSpaceQuotaUrl = `/cloud-foundry/${cfId}/organizations/${orgId}/space-quota-definitions/${spaceQuotaId}`;
    }
  }
}
