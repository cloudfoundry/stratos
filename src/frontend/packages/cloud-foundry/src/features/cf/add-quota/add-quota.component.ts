import { Component , ChangeDetectionStrategy } from '@angular/core';

import { PageHeaderComponent } from '@stratosui/core';
import { StepComponent, SteppersComponent } from '@stratosui/core';

import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { CreateQuotaStepComponent } from './create-quota-step/create-quota-step.component';

@Component({
  selector: 'app-add-quota',
  templateUrl: './add-quota.component.html',
  styleUrls: ['./add-quota.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    CreateQuotaStepComponent
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
