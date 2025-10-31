import { Component , ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { PageHeaderComponent } from '../../../../../core/src/shared/components/page-header/page-header.component';
import { StepComponent } from '../../../../../core/src/shared/components/stepper/step/step.component';
import { SteppersComponent } from '../../../../../core/src/shared/components/stepper/steppers/steppers.component';
import { QUOTA_FROM_LIST } from '../../../shared/components/list/list-types/cf-quotas/cf-quotas-list-config.service';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { QUOTA_SPACE_GUID } from '../space-quota-definition/space-quota-definition.component';
import { EditSpaceQuotaStepComponent } from './edit-space-quota-step/edit-space-quota-step.component';

@Component({
  selector: 'app-edit-space-quota',
  templateUrl: './edit-space-quota.component.html',
  styleUrls: ['./edit-space-quota.component.scss'],
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
