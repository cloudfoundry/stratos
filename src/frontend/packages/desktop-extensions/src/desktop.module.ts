import { NgModule } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ElectronService } from 'ngx-electron';

import { GetSystemInfo } from '../../store/src/actions/system.actions';
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

  constructor(
    router: Router,
    private _electronService: ElectronService,
    private store: Store)
  {
    // Only update the routes once
    if (!DesktopModule.init) {
      // Override the component used for the login route
      const routeConfig = [...router.config];
      const loginRoute = routeConfig.find(r => r.path === 'login') || {};
      loginRoute.component = DesktopLoginComponent;
      router.resetConfig(routeConfig);
      DesktopModule.init = true;
      this.init();
    }
  }

  // Listen for events from the Electron host
  private init() {
    this._electronService.ipcRenderer.addListener('endpointsChanged', (sender, args) => {
      console.log('Got an event - endpoints changed');
      console.log(sender);
      console.log(args);
      this.store.dispatch(new GetSystemInfo());
    });
  }
}
