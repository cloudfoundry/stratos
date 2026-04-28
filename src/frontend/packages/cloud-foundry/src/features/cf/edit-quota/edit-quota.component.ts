import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { PageHeaderComponent } from '../../../../../core/src/shared/components/page-header/page-header.component';
import { SteppersComponent } from '../../../../../core/src/shared/components/stepper/steppers/steppers.component';
import { StepComponent } from '../../../../../core/src/shared/components/stepper/step/step.component';
import { QUOTA_FROM_LIST } from '../quota-definition-base/quota-route-tokens';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { QUOTA_ORG_GUID } from '../quota-definition/quota-definition.component';
import { EditQuotaStepComponent } from './edit-quota-step/edit-quota-step.component';

@Component({
  selector: 'app-edit-quota',
  templateUrl: './edit-quota.component.html',
  styleUrls: ['./edit-quota.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    EditQuotaStepComponent
  ]
})
export class EditQuotaComponent {
  cfQuotasUrl: string;
  constructor() {
    const activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
    const activatedRoute = inject(ActivatedRoute);

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
