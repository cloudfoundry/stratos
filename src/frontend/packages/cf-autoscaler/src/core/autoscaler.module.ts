import { DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';

import { ApplicationService } from '../../../cloud-foundry/src/features/applications/application.service';
import {
  ApplicationEnvVarsHelper,
} from '../../../cloud-foundry/src/features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { CloudFoundrySharedModule } from '../../../cloud-foundry/src/shared/cf-shared.module';
import { CoreModule } from '@stratosui/core';
import { SharedModule } from '@stratosui/core';
import { AutoscalerRoutingModule } from './autoscaler.routing';


@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    AutoscalerRoutingModule,
    CloudFoundrySharedModule,
  ],
  declarations: [],
  providers: [
    ApplicationService,
    ApplicationEnvVarsHelper,
    DatePipe
  ]
})
export class AutoscalerModule { }
