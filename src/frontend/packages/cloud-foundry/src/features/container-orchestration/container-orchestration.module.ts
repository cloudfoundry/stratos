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
import { CfCellService } from './services/cf-cell.service';
import { ContainerOrchestrationService } from './services/container-orchestration.service';
import { EiriniMetricsService } from './services/eirini-metrics.service';

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
    CfCellService,
    ContainerOrchestrationService,
    EiriniMetricsService
  ]
})
export class CloudFoundryContainerOrchestrationModule { }