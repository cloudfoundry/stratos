import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ApiEndpointTypeSelectPageComponent } from './features/api-endpoint-type-select-page/api-endpoint-type-select-page.component';

const routes: Routes = [
  {
    path: '',
    component: ApiEndpointTypeSelectPageComponent,
    children: [
      {
        path: '/:endpointType',
        children: [{
          path: '/:endpointGuid',
          children: [{
            path: '/:entityType'
          }]
        }]
      }
    ]

  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ApiDrivenViewsRoutingModule { }
