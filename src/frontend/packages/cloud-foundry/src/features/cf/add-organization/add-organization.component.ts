import { Component, ChangeDetectionStrategy, inject } from '@angular/core';

import { PageHeaderComponent } from '../../../../../core/src/shared/components/page-header/page-header.component';
import { SteppersComponent } from '../../../../../core/src/shared/components/stepper/steppers/steppers.component';
import { StepComponent } from '../../../../../core/src/shared/components/stepper/step/step.component';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { CreateOrganizationStepComponent } from './create-organization-step/create-organization-step.component';

@Component({
  selector: 'app-add-organization',
  templateUrl: './add-organization.component.html',
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    CreateOrganizationStepComponent
  ]
})
export class AddOrganizationComponent {
  cfUrl: string;
  constructor() {
    const activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);

    const cfId = activeRouteCfOrgSpace.cfGuid;
    this.cfUrl = `/cloud-foundry/${cfId}/organizations`;
  }
}
