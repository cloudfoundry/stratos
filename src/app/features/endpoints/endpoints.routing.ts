import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

import { EndpointsPageComponent } from './endpoints-page/endpoints-page.component';


// TODO: RC split pages into sectional folders with own modules, use loadChildren: 'app/pages/pages.module#PagesModule' &
// RouterModule.forChild(appRoutes),

const endpointsRoutes: Routes = [
  { path: '', component: EndpointsPageComponent, }
];

@NgModule({
  imports: [
    RouterModule.forChild(endpointsRoutes),
  ]
})
export class EndointsRoutingModule { }
