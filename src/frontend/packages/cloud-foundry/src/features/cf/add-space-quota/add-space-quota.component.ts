import { Component, ChangeDetectionStrategy, inject } from '@angular/core';

import { PageHeaderComponent, StepComponent, SteppersComponent } from '@stratosui/core';
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

  constructor() {
    const activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);

    const cfId = activeRouteCfOrgSpace.cfGuid;
    const orgId = activeRouteCfOrgSpace.orgGuid;
    this.cfSpaceQuotasUrl = `/cloud-foundry/${cfId}/organizations/${orgId}/space-quota-definitions`;
  }
}
