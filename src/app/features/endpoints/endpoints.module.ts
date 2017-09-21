import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';

import { EndointsRoutingModule } from './endpoints.routing';
import { EndpointsPageComponent } from './endpoints-page/endpoints-page.component';


@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    EndointsRoutingModule
  ],
  declarations: [
    EndpointsPageComponent
  ]
})
export class EndpointsModule { }
