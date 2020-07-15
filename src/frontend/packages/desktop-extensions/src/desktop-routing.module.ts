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
  {
    path: 'installer',
    loadChildren: () => import('./installer/installer.module').then(m => m.InstallerModule),
    data: {
      reuseRoute: true,
      stratosNavigation: {
        text: 'Install',
        matIcon: 'deploy',
        matIconFont: 'stratos-icons',
        position: 60,
      }
    }
  },
]

@NgModule({
  imports: [
    RouterModule.forRoot(customRoutes),
  ],
  declarations: []
})
export class DesktopRoutingModule { }