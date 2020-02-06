import { Component } from '@angular/core';

import { ActiveRouteCfOrgSpace } from '../../../../../cloud-foundry/src/features/cloud-foundry/cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../../../../cloud-foundry/src/features/cloud-foundry/cf.helpers';

// TODO: Move CF code to CF Module #3769. There's a few quota related components to move

@Component({
  selector: 'app-add-quota',
  templateUrl: './add-quota.component.html',
  styleUrls: ['./add-quota.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ]
})
export class AddQuotaComponent {
  cfQuotasUrl: string;
  constructor(
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace
  ) {
    const cfId = activeRouteCfOrgSpace.cfGuid;
    this.cfQuotasUrl = `/cloud-foundry/${cfId}/quota-definitions`;
  }
}
