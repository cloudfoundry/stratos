import { NgModule } from '@angular/core';

import {
  CoreModule,
  CustomizationService,
  CustomizationsMetadata,
  ExtensionService,
  MDAppModule,
  SharedModule,
} from '../../core/src/public-api';
import { DemoHelperComponent } from './demo/demo-helper/demo-helper.component';
import { SuseAboutInfoComponent } from './suse-about-info/suse-about-info.component';
import { SuseLoginComponent } from './suse-login/suse-login.component';
import { SuseWelcomeComponent } from './suse-welcome/suse-welcome.component';

const SuseCustomizations: CustomizationsMetadata = {
  copyright: '&copy; 2020 SUSE',
  hasEula: true,
  aboutInfoComponent: SuseAboutInfoComponent,
  noEndpointsComponent: SuseWelcomeComponent,
  alwaysShowNavForEndpointTypes: (typ) => false,
};

@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    MDAppModule,
    ExtensionService.declare([
      SuseLoginComponent,
    ])
  ],
  // FIXME: Ensure that anything lazy loaded/in kube endpoint pages is not included here - #3675
  declarations: [
    SuseLoginComponent,
    SuseAboutInfoComponent,
    SuseWelcomeComponent,
    DemoHelperComponent
  ],
  entryComponents: [
    SuseLoginComponent,
    SuseAboutInfoComponent,
    SuseWelcomeComponent,
    DemoHelperComponent,
  ]
})
export class SuseModule {
  constructor(cs: CustomizationService) {
    cs.set(SuseCustomizations);
  }
}
