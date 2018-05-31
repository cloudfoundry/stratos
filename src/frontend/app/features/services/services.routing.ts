import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ServicesWallComponent } from './services-wall/services-wall.component';
import { AddServiceInstanceComponent } from '../service-catalog/add-service-instance/add-service-instance/add-service-instance.component';

const services: Routes = [
  {
    path: '',
    component: ServicesWallComponent,
  },
  {
    path: 'new',
    component: AddServiceInstanceComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(services),
  ]
})
export class ServicesRoutingModule { }
