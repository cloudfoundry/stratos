import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { PageHeaderComponent, SteppersComponent, StepComponent } from '@stratosui/core';

import { EditOrganizationStepComponent } from './edit-organization-step/edit-organization-step.component';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';

@Component({
  selector: 'app-edit-organization',
  templateUrl: './edit-organization.component.html',
  styleUrls: ['./edit-organization.component.scss'],
  providers: [getActiveRouteCfOrgSpaceProvider],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    EditOrganizationStepComponent
  ]
})
export class EditOrganizationComponent {

  orgUrl: string;

  constructor() {
    const activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);

    const { cfGuid, orgGuid } = activeRouteCfOrgSpace;
    this.orgUrl = `/cloud-foundry/${cfGuid}/organizations/${orgGuid}`;
  }

}
