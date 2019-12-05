import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import {
  AddServiceInstanceBaseStepComponent,
} from '../../shared/components/add-service-instance/add-service-instance-base-step/add-service-instance-base-step.component';
import {
  AddServiceInstanceComponent,
} from '../../shared/components/add-service-instance/add-service-instance/add-service-instance.component';
import { DetachServiceInstanceComponent } from './detach-service-instance/detach-service-instance.component';
import { ServicesWallComponent } from './services-wall/services-wall.component';

const services: Routes = [
  {
    path: '',
    component: ServicesWallComponent,
  },
  {
    path: 'new',
    component: AddServiceInstanceBaseStepComponent
  },
  {
    path: 'new/:type',
    component: AddServiceInstanceComponent
  },
  {
    path: ':type/:endpointId/:serviceInstanceId/edit',
    component: AddServiceInstanceComponent
  },
  {
    path: ':type/:endpointId/:serviceInstanceId/detach',
    component: DetachServiceInstanceComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(services),
  ]
})
export class ServicesRoutingModule { }
