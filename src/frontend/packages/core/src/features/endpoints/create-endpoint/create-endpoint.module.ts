import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { ConnectEndpointComponent } from '../connect-endpoint/connect-endpoint.component';
import { CreateEndpointBaseStepComponent } from './create-endpoint-base-step/create-endpoint-base-step.component';
import { CreateEndpointCfStep1Component } from './create-endpoint-cf-step-1/create-endpoint-cf-step-1.component';
import { CreateEndpointConnectComponent } from './create-endpoint-connect/create-endpoint-connect.component';
import { CreateEndpointComponent } from './create-endpoint.component';

@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    SharedModule
  ],
  declarations: [
    CreateEndpointComponent,
    CreateEndpointCfStep1Component,
    CreateEndpointBaseStepComponent,
    CreateEndpointConnectComponent,
    ConnectEndpointComponent
  ],
  exports: [
    CreateEndpointComponent,
    ConnectEndpointComponent
  ]
})
export class CreateEndpointModule { }
