import { NgModule } from '@angular/core';
import {
  CoreModule,
  CustomizationService,
  CustomizationsMetadata,
  ExtensionService,
  MDAppModule,
  SharedModule,
} from '@stratosui/core';

import { AcmeLoginComponent } from './acme-login/acme-login.component';
import { AcmeSupportInfoComponent } from './acme-support-info/acme-support-info.component';
import { AppActionExtensionComponent } from './app-action-extension/app-action-extension.component';
import { AppTabExtensionComponent } from './app-tab-extension/app-tab-extension.component';

const AcmeCustomizations: CustomizationsMetadata = {
  copyright: '&copy; 2020 ACME Corp',
  hasEula: true,
  supportInfoComponent: AcmeSupportInfoComponent,
};

@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    MDAppModule,
    ExtensionService.declare([
      AppTabExtensionComponent,
      AppActionExtensionComponent,
    ])
  ],
  declarations: [
    AcmeLoginComponent,
    AppTabExtensionComponent,
    AppActionExtensionComponent,
    AcmeSupportInfoComponent
  ]
})
export class ExampleModule {

  constructor(cs: CustomizationService) {
    cs.set(AcmeCustomizations);
  }
}
