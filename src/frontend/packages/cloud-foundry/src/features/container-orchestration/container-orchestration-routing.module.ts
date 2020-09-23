import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { of } from 'rxjs';

import {
  ContainerOrchestratorStepperComponent,
} from './components/container-orchestrator-stepper/container-orchestrator-stepper.component';


const customRoutes: Routes = [
  {
    path: ':endpointId/eirini',
    component: ContainerOrchestratorStepperComponent,
    data: {
      stratosNavigation: {
        text: 'Applications',
        matIcon: 'apps',
        position: 20,
        hidden: of(true)
      }
    },
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(customRoutes),
  ],
  declarations: []
})
export class CloudFoundryContainerOrchestrationRoutingModule { }