import { CommonModule } from '@angular/common';
import { Component , ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { PageHeaderComponent } from '../../../../../core/src/shared/components/page-header/page-header.component';
import { StepComponent } from '../../../../../core/src/shared/components/stepper/step/step.component';
import { SteppersComponent } from '../../../../../core/src/shared/components/stepper/steppers/steppers.component';
import { CfUserService } from '../../../shared/data-services/cf-user.service';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../shared/services/cloud-foundry-user-provided-services.service';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../services/cloud-foundry-space.service';
import { EditSpaceStepComponent } from './edit-space-step/edit-space-step.component';

@Component({
  selector: 'app-edit-space',
  templateUrl: './edit-space.component.html',
  styleUrls: ['./edit-space.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    CfUserService,
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

  spaceName$: Observable<string>;
  spaceUrl: string;

  constructor(cfSpaceService: CloudFoundrySpaceService) {

    this.spaceUrl = '/cloud-foundry/' +
      `${cfSpaceService.cfGuid}/organizations/` +
      `${cfSpaceService.orgGuid}/spaces/` +
      `${cfSpaceService.spaceGuid}/summary`;
    this.spaceName$ = cfSpaceService.space$.pipe(
      map(s => s.entity.entity.name)
    );
  }
}
