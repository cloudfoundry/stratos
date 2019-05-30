import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';

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
    this.cfSpaceQuotaUrl = `/cloud-foundry/${cfId}/organizations/${orgId}/space-quota-definitions/${spaceQuotaId}`;
  }
}
