import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';

import { PageHeaderComponent, StepComponent, SteppersComponent } from '@stratosui/core';
import { CloudFoundryUserProvidedServicesService } from '../../../shared/services/cloud-foundry-user-provided-services.service';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../services/cloud-foundry-space.service';
import { EditSpaceStepComponent } from './edit-space-step/edit-space-step.component';

@Component({
  selector: 'app-edit-space',
  templateUrl: './edit-space.component.html',
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    CloudFoundryEndpointService,
    CloudFoundrySpaceService,
    CloudFoundryOrganizationService,
    CloudFoundryUserProvidedServicesService
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    PageHeaderComponent,
    StepComponent,
    SteppersComponent,
    EditSpaceStepComponent
  ]
})
export class EditSpaceComponent {

  readonly space = inject(CloudFoundrySpaceService).spaceDataService.space;
  spaceUrl: string;

  constructor() {
    const cfSpaceService = inject(CloudFoundrySpaceService);

    this.spaceUrl = '/cloud-foundry/' +
      `${cfSpaceService.cfGuid}/organizations/` +
      `${cfSpaceService.orgGuid}/spaces/` +
      `${cfSpaceService.spaceGuid}/summary`;
  }
}
