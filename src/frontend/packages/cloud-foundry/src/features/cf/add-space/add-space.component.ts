import { Component, ChangeDetectionStrategy, inject } from '@angular/core';

import { PageHeaderComponent } from '@stratosui/core';
import { StepComponent, SteppersComponent } from '@stratosui/core';

import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { CreateSpaceStepComponent } from './create-space-step/create-space-step.component';


@Component({
  selector: 'app-add-space',
  templateUrl: './add-space.component.html',
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    CreateSpaceStepComponent
  ]
})
export class AddSpaceComponent {

  ogrSpacesUrl: string;
  constructor() {
    const activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);

    const cfId = activeRouteCfOrgSpace.cfGuid;
    const orgId = activeRouteCfOrgSpace.orgGuid;
    this.ogrSpacesUrl = `/cloud-foundry/${cfId}/organizations/${orgId}/spaces`;
  }

}
