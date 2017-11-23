import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';

import { EndointsRoutingModule } from './endpoints.routing';
import { EndpointsPageComponent } from './endpoints-page/endpoints-page.component';
import { CreateEndpointComponent } from './create-endpoint/create-endpoint.component';
import { CreateEndpointModule } from './create-endpoint/create-endpoint.module';
import { EndpointsMissingComponent } from './endpoints-page/endpoints-missing/endpoints-missing.component';


@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    EndointsRoutingModule,
    CreateEndpointModule
  ],
  declarations: [
    EndpointsPageComponent,
    EndpointsMissingComponent,
  ],
})
export class EndpointsModule { }
