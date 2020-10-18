import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule, SharedModule } from '../../../../core/src/public-api';
import {
  ContainerOrchestratorStepComponent,
} from './components/container-orchestrator-stepper/container-orchestrator-step/container-orchestrator-step.component';
import {
  ContainerOrchestratorStepperComponent,
} from './components/container-orchestrator-stepper/container-orchestrator-stepper.component';
import { CloudFoundryContainerOrchestrationRoutingModule } from './container-orchestration-routing.module';
import { ContainerOrchestrationService } from './services/container-orchestration.service';
import { DiegoContainerService } from './services/diego-container.service';
import { EiriniContainerService } from './services/eirini-container.service';

@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    SharedModule,
    CloudFoundryContainerOrchestrationRoutingModule,
  ],
  declarations: [
    ContainerOrchestratorStepperComponent,
    ContainerOrchestratorStepComponent
  ],
  exports: [

  ],
  entryComponents: [

  ],
  providers: [
    DiegoContainerService,
    EiriniContainerService,
    ContainerOrchestrationService,
  ]
})
export class CloudFoundryContainerOrchestrationModule { }