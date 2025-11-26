import { NgModule } from '@angular/core';
import { RouterModule, type Routes } from '@angular/router';

import { DesktopSettingsComponent } from './desktop-settings/desktop-settings.component';


const settingsRoutes: Routes = [
  {
    path: '',
    component: DesktopSettingsComponent,
  },
];

@NgModule({
  imports: [
    RouterModule.forChild(settingsRoutes)
  ]
})
export class SettingsRoutingModule {
}
