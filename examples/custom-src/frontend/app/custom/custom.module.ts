import { NgModule } from '@angular/core';
import { CoreModule } from '../core/core.module';
import { Customizations, CustomizationsMetadata } from '../core/customizations.types';
import { MDAppModule } from '../core/md.module';
import { SharedModule } from '../shared/shared.module';
import { AcmeLoginComponent } from './acme-login/acme-login.component';
import { StratosExtension } from '../core/extension/extension-service';
import { AppTabExtensionComponent } from './app-tab-extension/app-tab-extension.component';
import { EndpointType } from '../store/types/endpoint.types';

const AcmeCustomizations: CustomizationsMetadata = {
  copyright: '&copy; 2018 ACME Corp',
  hasEula: true,
};

// CustomModule is bundled in to the main application bundle
@StratosExtension({
  routes: [{
    path: 'example',
    loadChildren: 'app/custom/nav-extension/nav-extension.module#NavExtensionModule',
    data: {
      stratosNavigation: {
        text: 'Example',
        matIcon: 'extension'
      }
    }
  }],
  authTypes: [
    {
      name: 'Kubeconfig file',
      value: 'kube-config',
      formType: 'config',
      data: {
        message: 'Select Kubeconfig file:',
      },
      types: new Array<EndpointType>('cf')
    }
  ]
})
@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    MDAppModule,
  ],
  declarations: [
    AcmeLoginComponent,
    AppTabExtensionComponent
  ],
  entryComponents: [
    AcmeLoginComponent,
    // You must specify the tab as an entry component
    AppTabExtensionComponent
  ],
  providers: [
    { provide: Customizations, useValue: AcmeCustomizations }
  ],
})
export class CustomModule {}
