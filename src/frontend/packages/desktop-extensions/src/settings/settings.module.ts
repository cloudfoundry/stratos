import { NgModule } from '@angular/core';
import { CoreModule, SharedModule } from '@stratosui/core';

import { DesktopSettingsComponent } from './desktop-settings/desktop-settings.component';
import { SettingsRoutingModule } from './settings.routing';

@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    SettingsRoutingModule,
    // Standalone components
    DesktopSettingsComponent
  ]
})
export class DesktopSettingsModule { }