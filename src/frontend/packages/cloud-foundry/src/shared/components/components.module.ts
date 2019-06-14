import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '../../../../core/src/core/core.module';
import { SharedModule } from '../../../../core/src/shared/shared.module';
import { CfEndpointDetailsComponent } from './cf-endpoint-details/cf-endpoint-details.component';
import {
  ContainerOrchestratorStepComponent,
} from './container-orchestrator-stepper/container-orchestrator-step/container-orchestrator-step.component';
import {
  ContainerOrchestratorStepperComponent,
} from './container-orchestrator-stepper/container-orchestrator-stepper.component';

@NgModule({
  imports: [
    CoreModule,
    CommonModule,
    SharedModule,
  ],
  declarations: [
    CfEndpointDetailsComponent,
    ContainerOrchestratorStepComponent,
    ContainerOrchestratorStepperComponent
  ],
  exports: [
    CfEndpointDetailsComponent
  ],
  entryComponents: [
    CfEndpointDetailsComponent
  ]
})
export class CloudFoundryComponentsModule { }
