import { Component , ChangeDetectionStrategy } from '@angular/core';

import { PageHeaderComponent } from '../../../../../core/src/shared/components/page-header/page-header.component';
import { StepComponent } from '../../../../../core/src/shared/components/stepper/step/step.component';
import { SteppersComponent } from '../../../../../core/src/shared/components/stepper/steppers/steppers.component';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { CreateSpaceQuotaStepComponent } from './create-space-quota-step/create-space-quota-step.component';

@Component({
  selector: 'app-add-space-quota',
  templateUrl: './add-space-quota.component.html',
  styleUrls: ['./add-space-quota.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    CreateSpaceQuotaStepComponent
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
