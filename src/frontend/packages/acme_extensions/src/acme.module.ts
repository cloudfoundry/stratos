import { NgModule } from '@angular/core';
import { Customizations, CustomizationsMetadata } from '@stratos/core';
import { AcmeSupportInfoComponent } from './acme-support-info/acme-support-info.component';
import { AppTabExtensionComponent } from './app-tab-extension/app-tab-extension.component';
import { AppActionExtensionComponent } from './app-action-extension/app-action-extension.component';

const AcmeCustomizations: CustomizationsMetadata = {
  copyright: '&copy; 2019 ACME Corp',
  hasEula: true,
  // supportInfoComponent: AcmeSupportInfoComponent,
};

@NgModule({
  imports: [
    // CoreModule,
    // SharedModule,
    // MDAppModule,
  ],
  declarations: [
    //AcmeLoginComponent,
    AppTabExtensionComponent,
    AppActionExtensionComponent,
    //AcmeSupportInfoComponent
  ],
  entryComponents: [
    //AcmeLoginComponent,
    // You must specify the tab and action as an entry components
    AppTabExtensionComponent,
    AppActionExtensionComponent,
    //AcmeSupportInfoComponent
  ],
  providers: [
    { provide: Customizations, useValue: AcmeCustomizations }
  ],
})
export class AcmeModule {}

console.log('AcmeModule');
