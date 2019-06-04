import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '../../../../core/src/core/core.module';
import { SharedModule } from '../../../../core/src/shared/shared.module';
import { CfEndpointDetailsComponent } from './cf-endpoint-details/cf-endpoint-details.component';
import { CfSchedulerStepComponent } from './eirini-stepper/cf-scheduler-step/cf-scheduler-step.component';
import { EiriniStepperComponent } from './eirini-stepper/eirini-stepper.component';

@NgModule({
  imports: [
    CoreModule,
    CommonModule,
    SharedModule,
  ],
  declarations: [
    CfEndpointDetailsComponent,
    EiriniStepperComponent,
    CfSchedulerStepComponent
  ],
  exports: [
    CfEndpointDetailsComponent
  ],
  entryComponents: [
    CfEndpointDetailsComponent
  ]
})
export class CloudFoundryComponentsModule { }
