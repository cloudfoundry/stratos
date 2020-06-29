import { NgModule } from '@angular/core';
import { Router } from '@angular/router';

import { CoreModule } from '../../../core/src/core/core.module';
import { CustomizationService, CustomizationsMetadata } from '../../../core/src/core/customizations.types';
import { MDAppModule } from '../../../core/src/core/md.module';
import { SharedModule } from '../../../core/src/shared/shared.module';
import { DemoHelperComponent } from './demo/demo-helper/demo-helper.component';
import { HelmSetupModule } from './helm/helm.setup.module';
import { KubernetesSetupModule } from './kubernetes/kubernetes.setup.module';
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
    KubernetesSetupModule,
    HelmSetupModule,
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

  static init = false;

  constructor(router: Router, cs: CustomizationService) {
    cs.set(SuseCustomizations);

    // Only update the routes once
    if (!SuseModule.init) {
      // Override the component used for the login route
      const routeConfig = [...router.config];
      const loginRoute = routeConfig.find(r => r.path === 'login') || {};
      loginRoute.component = SuseLoginComponent;
      router.resetConfig(routeConfig);
      SuseModule.init = true;
    }
  }
}
