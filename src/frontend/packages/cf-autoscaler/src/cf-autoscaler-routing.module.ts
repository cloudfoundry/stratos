import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { of } from 'rxjs';

// FIXME Work out why we need this and remove it.
const customRoutes: Routes = [
  {
    path: 'autoscaler',
    loadChildren: () => import('./core/autoscaler.module').then(m => m.AutoscalerModule),
    data: {
      stratosNavigation: {
        text: 'Applications',
        matIcon: 'apps',
        position: 20,
        hidden: of(true)
      }
    },
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(customRoutes),
  ],
})
export class CfAutoscalerRoutingModule { }
