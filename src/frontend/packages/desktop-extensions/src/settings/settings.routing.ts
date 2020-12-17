import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

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
