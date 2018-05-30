import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import {
  AddServiceInstanceComponent,
} from '../../shared/components/add-service-instance/add-service-instance/add-service-instance.component';
import { ServicesWallComponent } from './services-wall/services-wall.component';

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
    path: ':cfId/:serviceInstanceId/edit',
    component: AddServiceInstanceComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(services),
  ]
})
export class ServicesRoutingModule { }
