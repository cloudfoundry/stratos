import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const customRoutes: Routes = [
  {
    path: 'desktop-settings',
    loadChildren: () => import('./settings/settings.module').then(m => m.DesktopSettingsModule),
    data: {
      stratosNavigationPage: true
    },
  },
]

@NgModule({
  imports: [
    RouterModule.forRoot(customRoutes),
  ],
  declarations: []
})
export class DesktopRoutingModule { }