import { NgModule } from '@angular/core';
import { CoreModule } from '../core/core.module';
import { Customizations, CustomizationsMetadata } from '../core/customizations.types';
import { MDAppModule } from '../core/md.module';
import { SharedModule } from '../shared/shared.module';
import { AcmeLoginComponent } from './acme-login/acme-login.component';
import { AppTabExtensionComponent } from './app-tab-extension/app-tab-extension.component';
import { AppActionExtensionComponent } from './app-action-extension/app-action-extension.component';
import { AcmeSupportInfoComponent } from './acme-support-info/acme-support-info.component';

const AcmeCustomizations: CustomizationsMetadata = {
  copyright: '&copy; 2018 ACME Corp',
  hasEula: true,
  supportInfoComponent: AcmeSupportInfoComponent,
};

@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    MDAppModule,
  ],
  declarations: [
    AcmeLoginComponent,
    AppTabExtensionComponent,
    AppActionExtensionComponent,
    AcmeSupportInfoComponent
  ],
  entryComponents: [
    AcmeLoginComponent,
    // You must specify the tab and action as an entry components
    AppTabExtensionComponent,
    AppActionExtensionComponent,
    AcmeSupportInfoComponent
  ],
  providers: [
    { provide: Customizations, useValue: AcmeCustomizations }
  ],
})
export class CustomModule {}
