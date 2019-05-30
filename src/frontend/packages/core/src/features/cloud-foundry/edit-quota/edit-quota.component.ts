import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';

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
    this.cfQuotasUrl = `/cloud-foundry/${cfId}/quota-definitions/${quotaId}`;
  }
}
