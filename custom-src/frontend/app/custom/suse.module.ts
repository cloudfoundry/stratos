import { NgModule } from '@angular/core';
import { Router } from '@angular/router';
import { CoreModule } from '../core/core.module';
import { Customizations, CustomizationsMetadata } from '../core/customizations.types';
import { MDAppModule } from '../core/md.module';
import { SharedModule } from '../shared/shared.module';
import { SuseLoginComponent } from './suse-login/suse-login.component';

const SuseCustomizations: CustomizationsMetadata = {
  copyright: '&copy; 2018 SUSE',
  hasEula: true,
};

@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    MDAppModule,
  ],
  declarations: [
    SuseLoginComponent
  ],
  entryComponents: [
    SuseLoginComponent
  ],
  providers: [
    { provide: Customizations, useValue: SuseCustomizations }
  ],
})
export class SuseModule {

  constructor(private router: Router) {
    // Override the component used for the login route
    const routeConfig = [...router.config];
    const loginRoute = routeConfig.find(r => r.path === 'login') || {};
    loginRoute.component = SuseLoginComponent;
    router.resetConfig(routeConfig);
  }
}
