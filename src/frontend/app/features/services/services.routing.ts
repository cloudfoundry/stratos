import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ServicesWallComponent } from './services-wall/services-wall.component';

const services: Routes = [
  {
    path: '',
    component: ServicesWallComponent,
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(services),
  ]
})
export class ServicesRoutingModule { }
