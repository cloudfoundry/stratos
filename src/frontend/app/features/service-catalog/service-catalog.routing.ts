import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ServiceBaseComponent } from './service-base/service-base.component';
import { ServiceCatalogPageComponent } from './service-catalog-page/service-catalog-page.component';
import { ServiceInstancesComponent } from './service-instances/service-instances.component';
import { AddServiceInstanceComponent } from './add-service-instance/add-service-instance/add-service-instance.component';
const serviceCatalog: Routes = [
  {
    path: '',
    component: ServiceCatalogPageComponent,
  },
  {
    path: ':cfId/:serviceId/create',
    component: AddServiceInstanceComponent,
  },
  {
    path: ':cfId/:serviceId',
    component: ServiceBaseComponent,

    children: [
      {
        path: '',
        redirectTo: 'instances',
        pathMatch: 'full'
      },
      {
        path: 'instances',
        component: ServiceInstancesComponent
      }]
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(serviceCatalog),
  ]
})
export class ServiceCatalogRoutingModule { }
