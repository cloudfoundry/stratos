import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const customRoutes: Routes = [
  {
    path: 'autoscaler',
    loadChildren: './autoscaler/autoscaler.module#AutoscalerModule',
    data: {
      stratosNavigation: {
        text: 'Applications',
        matIcon: 'apps',
        position: 20
      }
    },
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(customRoutes),
  ],
  declarations: []
})
export class CustomRoutingModule { }
