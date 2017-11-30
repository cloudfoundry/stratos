import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

import { EndpointsPageComponent } from './endpoints-page/endpoints-page.component';
import { CreateEndpointComponent } from './create-endpoint/create-endpoint.component';

const endpointsRoutes: Routes = [
  { path: '', component: EndpointsPageComponent, },
  { path: 'new', component: CreateEndpointComponent },
];

@NgModule({
  imports: [
    RouterModule.forChild(endpointsRoutes),
  ]
})
export class EndointsRoutingModule { }
