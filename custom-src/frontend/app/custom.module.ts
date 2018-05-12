import { NgModule } from '@angular/core';
import { SuseLoginComponent } from './custom/suse-login/suse-login.component';
import { EULA_PROVIDER } from './features/about/about-page/about-page.component';
import { Router } from '@angular/router';

@NgModule({
  declarations: [
    SuseLoginComponent
  ],
  imports: [
    Router
  ],
  providers: [
    { provide: EULA_PROVIDER, useValue: true }
  ],
  entryComponents: [
    SuseLoginComponent
  ]
})
export class CustomModule {

  constructor(private router: Router) {
    // Override the component used for the login route
    const routeConfig = { ...router.config };
    const loginRoute = routeConfig.find(r => r.path === 'login') || {};
    loginRoute.component = SuseLoginComponent;
    router.resetConfig(routeConfig);
  }
}
