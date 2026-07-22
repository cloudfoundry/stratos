import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { PageHeaderComponent, StepComponent, SteppersComponent } from '@stratosui/core';
import { QUOTA_FROM_LIST } from '../quota-definition-base/quota-route-tokens';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { QUOTA_SPACE_GUID } from '../space-quota-definition/space-quota-definition.component';
import { EditSpaceQuotaStepComponent } from './edit-space-quota-step/edit-space-quota-step.component';

@Component({
  selector: 'app-edit-space-quota',
  templateUrl: './edit-space-quota.component.html',
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    EditSpaceQuotaStepComponent
  ]
})
export class EditSpaceQuotaComponent {
  cfSpaceQuotaUrl: string;
  constructor() {
    const activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
    const activatedRoute = inject(ActivatedRoute);

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
