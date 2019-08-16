import { Component } from '@angular/core';
import { getActiveRouteCfOrgSpaceProvider } from '../../../../../cloud-foundry/src/features/cloud-foundry/cf.helpers';
import { ActiveRouteCfOrgSpace } from '../../../../../cloud-foundry/src/features/cloud-foundry/cf-page.types';

@Component({
  selector: 'app-add-space-quota',
  templateUrl: './add-space-quota.component.html',
  styleUrls: ['./add-space-quota.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ]
})
export class AddSpaceQuotaComponent {
  cfSpaceQuotasUrl: string;

  constructor(
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace
  ) {
    const cfId = activeRouteCfOrgSpace.cfGuid;
    const orgId = activeRouteCfOrgSpace.orgGuid;
    this.cfSpaceQuotasUrl = `/cloud-foundry/${cfId}/organizations/${orgId}/space-quota-definitions`;
  }
}
