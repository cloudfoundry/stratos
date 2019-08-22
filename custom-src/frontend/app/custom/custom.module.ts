import { NgModule } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { AppState } from '../../../store/src/app-state';
import { EndpointHealthCheck } from '../../endpoints-health-checks';
import { CoreModule } from '../core/core.module';
import { Customizations, CustomizationsMetadata } from '../core/customizations.types';
import { EndpointsService } from '../core/endpoints.service';
import { MDAppModule } from '../core/md.module';
import { SharedModule } from '../shared/shared.module';
import { DemoHelperComponent } from './demo/demo-helper/demo-helper.component';
import { KubernetesSetupModule } from './kubernetes/kubernetes.setup.module';
import { KubeHealthCheck } from './kubernetes/store/kubernetes.actions';
import { SuseAboutInfoComponent } from './suse-about-info/suse-about-info.component';
import { SuseLoginComponent } from './suse-login/suse-login.component';
import { HelmModule } from './helm/helm.module';
import { HelmSetupModule } from './helm/helm.setup.module';

const SuseCustomizations: CustomizationsMetadata = {
  copyright: '&copy; 2019 SUSE',
  hasEula: true,
  aboutInfoComponent: SuseAboutInfoComponent,
  alwaysShowNavForEndpointTypes: (typ) => false,
};

@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    MDAppModule,
    KubernetesSetupModule,
    HelmModule,
    HelmSetupModule
  ],
  declarations: [
    SuseLoginComponent,
    SuseAboutInfoComponent,
    DemoHelperComponent
  ],
  entryComponents: [
    SuseLoginComponent,
    SuseAboutInfoComponent,
    DemoHelperComponent,
  ],
  providers: [
    { provide: Customizations, useValue: SuseCustomizations }
  ],
})
export class CustomModule {

  static init = false;

  constructor(endpointService: EndpointsService, store: Store<AppState>, router: Router) {
    endpointService.registerHealthCheck(
      new EndpointHealthCheck('k8s', (endpoint) => store.dispatch(new KubeHealthCheck(endpoint.guid)))
    );
    // Only update the routes once
    if (!CustomModule.init) {
      // Override the component used for the login route
      const routeConfig = [...router.config];
      const loginRoute = routeConfig.find(r => r.path === 'login') || {};
      loginRoute.component = SuseLoginComponent;
      router.resetConfig(routeConfig);
      CustomModule.init = true;
    }
  }
}
