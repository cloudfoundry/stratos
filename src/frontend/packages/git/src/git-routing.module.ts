import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Add any lazy loaded routes here and bring in the GitModule
const customRoutes: Routes = [
  // {
  //   path: 'autoscaler',
  //   loadChildren: () => import('./core/autoscaler.module').then(m => m.GitModule),
  //   data: {
  //     // Required to place content in the mat-drawer-content/.page-content container
  //     stratosNavigationPage: true
  //   },
  // },
];

@NgModule({
  imports: [
    RouterModule.forRoot(customRoutes),
  ],
})
export class GitRoutingModule { }
