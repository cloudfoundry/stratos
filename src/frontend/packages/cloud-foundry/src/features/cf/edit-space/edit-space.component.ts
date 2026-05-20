import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, Injector, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { PageHeaderComponent, StepComponent, SteppersComponent } from '@stratosui/core';
import { CfUserService } from '../../../shared/data-services/cf-user.service';
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

  constructor() {
    const cfSpaceService = inject(CloudFoundrySpaceService);
    const injector = inject(Injector);

    this.spaceUrl = '/cloud-foundry/' +
      `${cfSpaceService.cfGuid}/organizations/` +
      `${cfSpaceService.orgGuid}/spaces/` +
      `${cfSpaceService.spaceGuid}/summary`;
    this.spaceName$ = toObservable(cfSpaceService.spaceDataService.space, { injector }).pipe(
      filter(s => !!s),
      map(s => s!.name),
    );
  }
}
