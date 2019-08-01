import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { QUOTA_FROM_LIST } from '../../../shared/components/list/list-types/cf-quotas/cf-quotas-list-config.service';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { QUOTA_ORG_GUID } from '../quota-definition/quota-definition.component';

@Component({
  selector: 'app-edit-quota',
  templateUrl: './edit-quota.component.html',
  styleUrls: ['./edit-quota.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ]
})
export class EditQuotaComponent {
  cfQuotasUrl: string;
  constructor(
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    activatedRoute: ActivatedRoute
  ) {
    const cfId = activeRouteCfOrgSpace.cfGuid;
    const quotaId = activatedRoute.snapshot.params.quotaId;
    const orgGuid = activatedRoute.snapshot.queryParams[QUOTA_ORG_GUID];
    const fromList = activatedRoute.snapshot.queryParams[QUOTA_FROM_LIST];

    if (orgGuid) {
      this.cfQuotasUrl = `/cloud-foundry/${cfId}/organizations/${orgGuid}/quota`;
    } else if (fromList) {
      this.cfQuotasUrl = `/cloud-foundry/${cfId}/quota-definitions`;
    } else {
      this.cfQuotasUrl = `/cloud-foundry/${cfId}/quota-definitions/${quotaId}`;
    }
  }
}
