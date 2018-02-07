import { CommonModule } from '@angular/common';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { CreateEndpointComponent } from './create-endpoint.component';
import { NgModule } from '@angular/core';
import { CreateEndpointCfStep1Component } from './create-endpoint-cf-step-1/create-endpoint-cf-step-1.component';

@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    SharedModule
  ],
  declarations: [
    CreateEndpointComponent,
    CreateEndpointCfStep1Component,
  ],
  exports: [
    CreateEndpointComponent
  ]
})
export class CreateEndpointModule { }
