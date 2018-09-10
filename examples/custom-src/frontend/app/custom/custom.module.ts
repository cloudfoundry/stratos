import { NgModule } from '@angular/core';
import { CoreModule } from '../core/core.module';
import { Customizations, CustomizationsMetadata } from '../core/customizations.types';
import { MDAppModule } from '../core/md.module';
import { SharedModule } from '../shared/shared.module';
import { AcmeLoginComponent } from './acme-login/acme-login.component';
import { StratosNavExtension } from '../core/extension/extension-service';
import { AppTabExtensionComponent } from './app-tab-extension/app-tab-extension.component';
import { AcmeSupportInfoComponent } from './acme-support-info/acme-support-info.component';

const AcmeCustomizations: CustomizationsMetadata = {
  copyright: '&copy; 2018 ACME Corp',
  hasEula: true,
  supportInfoComponent: AcmeSupportInfoComponent,
};

// CustomModule is bundled in to the main application bundle
@StratosNavExtension({
  routes: [{
    path: 'example',
    loadChildren: 'app/custom/nav-extension/nav-extension.module#NavExtensionModule',
    data: {
      stratosNavigation: {
        text: 'Example',
        matIcon: 'extension'
      }
    }
  }]
})
@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    MDAppModule,
  ],
  declarations: [
    AcmeLoginComponent,
    AppTabExtensionComponent,
    AcmeSupportInfoComponent
  ],
  entryComponents: [
    AcmeLoginComponent,
    // You must specify the tab as an entry component
    AppTabExtensionComponent,
    AcmeSupportInfoComponent
  ],
  providers: [
    { provide: Customizations, useValue: AcmeCustomizations }
  ],
})
export class CustomModule {}
