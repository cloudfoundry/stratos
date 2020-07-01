import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Things in this path include add/edit policy stepper, policy metrics page and policy events page
// They're include like this to ensure those parts are lazy loaded.
// The core application policy tab is included via CfAutoscalerModule, which is imported in the Application Module
const customRoutes: Routes = [
  {
    path: 'autoscaler',
    loadChildren: () => import('./core/autoscaler.module').then(m => m.AutoscalerModule),
    data: {
      // Required to place content in the mat-drawer-content/.page-content container
      stratosNavigationPage: true
    },
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(customRoutes),
  ],
})
export class CfAutoscalerRoutingModule { }
