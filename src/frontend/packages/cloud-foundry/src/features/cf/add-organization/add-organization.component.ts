import { Component , ChangeDetectionStrategy } from '@angular/core';

import { PageHeaderComponent, SteppersComponent, StepComponent } from '@stratosui/core';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { CreateOrganizationStepComponent } from './create-organization-step/create-organization-step.component';

@Component({
  selector: 'app-add-organization',
  templateUrl: './add-organization.component.html',
  styleUrls: ['./add-organization.component.scss'],
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
  constructor(
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace
  ) {
    const cfId = activeRouteCfOrgSpace.cfGuid;
    this.cfUrl = `/cloud-foundry/${cfId}/organizations`;
  }
}
