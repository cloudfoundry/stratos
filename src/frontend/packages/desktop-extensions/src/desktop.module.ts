import { NgModule } from '@angular/core';
import { Router } from '@angular/router';

import { DesktopLoginComponent } from './desktop-login/desktop-login.component';

@NgModule({
  declarations: [
    DesktopLoginComponent
  ],
  entryComponents: [
    DesktopLoginComponent
  ]
})
export class DesktopModule {

  static init = false;

  constructor(router: Router) {
    // Only update the routes once
    if (!DesktopModule.init) {
      // Override the component used for the login route
      const routeConfig = [...router.config];
      const loginRoute = routeConfig.find(r => r.path === 'login') || {};
      loginRoute.component = DesktopLoginComponent;
      router.resetConfig(routeConfig);
      DesktopModule.init = true;
    }
  }
}