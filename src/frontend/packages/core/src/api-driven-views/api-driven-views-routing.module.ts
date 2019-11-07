import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ApiEndpointTypeSelectPageComponent } from './features/api-endpoint-type-select-page/api-endpoint-type-select-page.component';
import { ApiEntityTypeSelectPageComponent } from './features/api-entity-type-select-page/api-entity-type-select-page.component';
import { ApiEndpointSelectPageComponent } from './features/api-endpoint-select-page/api-endpoint-select-page.component';
import { ApiEntityListPageComponent } from './features/api-entity-list-page/api-entity-list-page.component';

const routes: Routes = [
  {
    path: '',
    component: ApiEndpointTypeSelectPageComponent,
    // children: [
    //   {
    //     path: ':endpointType',
    //     component: ApiEntityTypeSelectPageComponent,
    //     children: [{
    //       path: '/:endpointGuid',
    //       children: [{
    //         path: '/:entityType'
    //       }]
    //     }]
    //   }
    // ]

  },
  {
    path: ':endpointType',
    component: ApiEndpointSelectPageComponent
  },
  {
    path: ':endpointType/:endpointId',
    component: ApiEntityTypeSelectPageComponent,
    children: [{
      path: ':entityType',
      component: ApiEntityListPageComponent
    }]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ApiDrivenViewsRoutingModule { }
