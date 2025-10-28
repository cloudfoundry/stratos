import { DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';

import { CfAutoscalerModule } from '../../../../cf-autoscaler/src/cf-autoscaler.module';
import { CoreModule, SharedModule } from '@stratosui/core';
import { GitSharedModule } from '../../../../git/src/shared/git-shared.module';
import { CloudFoundrySharedModule } from '../../shared/cf-shared.module';
import { ApplicationsRoutingModule } from './applications.routing';
import { ApplicationDeploySourceTypes } from './deploy-application/deploy-application-steps.types';


@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    ApplicationsRoutingModule,
    CloudFoundrySharedModule,
    // FIXME: Remove hard link between cf and autoscaler packages #4416
    CfAutoscalerModule,
    GitSharedModule
  ],
  declarations: [],
  providers: [
    DatePipe,
    ApplicationDeploySourceTypes,
  ]
})
export class ApplicationsModule { }
