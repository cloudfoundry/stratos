import { NgModule } from '@angular/core';
import { Router } from '@angular/router';
import { CoreModule } from './core/core.module';
import { MDAppModule } from './core/md.module';
import { SuseLoginComponent } from './custom/suse-login/suse-login.component';
import { EULA_PROVIDER } from './features/about/about-page/about-page.component';
import { SIDENAV_COPYRIGHT } from './features/dashboard/side-nav/side-nav.component';
import { SharedModule } from './shared/shared.module';

@NgModule({
  declarations: [
    SuseLoginComponent,
  ],
  imports: [
    CoreModule,
    SharedModule,
    MDAppModule,
  ],
  providers: [
    { provide: EULA_PROVIDER, useValue: true },
    { provide: SIDENAV_COPYRIGHT, useValue: '&copy; 2018 SUSE' }
  ],
  entryComponents: [
    SuseLoginComponent
  ]
})
export class CustomModule {

  constructor(private router: Router) {
    // Override the component used for the login route
    const routeConfig = [ ...router.config ];
    const loginRoute = routeConfig.find(r => r.path === 'login') || {};
    loginRoute.component = SuseLoginComponent;
    router.resetConfig(routeConfig);
  }
}
