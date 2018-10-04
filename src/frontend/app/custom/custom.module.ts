import { NgModule } from '@angular/core';
import { Router } from '@angular/router';
import { CoreModule } from '../core/core.module';
import { Customizations, CustomizationsMetadata } from '../core/customizations.types';
import { MDAppModule } from '../core/md.module';
import { SharedModule } from '../shared/shared.module';
import { SuseLoginComponent } from './suse-login/suse-login.component';
import { AboutModule } from '../features/about/about.module';
import { KubernetesSetupModule } from './kubernetes/kubernetes.setup.module';
import { ExtensionManager } from '../core/extension/extension-manager-service';

const SuseCustomizations: CustomizationsMetadata = {
  copyright: '&copy; 2018 SUSE',
  hasEula: true,
};

@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    MDAppModule,
    KubernetesSetupModule
  ],
  declarations: [
    SuseLoginComponent
  ],
  entryComponents: [
    SuseLoginComponent,
  ],
  providers: [
    { provide: Customizations, useValue: SuseCustomizations }
  ],
})
export class CustomModule {

  static init = false;

  constructor(private router: Router, private ext: ExtensionManager) {
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
