import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import {
  AddServiceInstanceComponent,
} from '../../shared/components/add-service-instance/add-service-instance/add-service-instance.component';
import { ServicesWallComponent } from './services-wall/services-wall.component';
import { DetachServiceInstanceComponent } from './detach-service-instance/detach-service-instance.component';

const services: Routes = [
  {
    path: '',
    component: ServicesWallComponent,
  },
  {
    path: 'new',
    component: AddServiceInstanceComponent
  },
  {
    path: ':endpointId/:serviceInstanceId/edit',
    component: AddServiceInstanceComponent
  },
  {
    path: ':endpointId/:serviceInstanceId/detach',
    component: DetachServiceInstanceComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(services),
  ]
})
export class ServicesRoutingModule { }
