import { NgModule } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { GetSystemInfo } from '../../store/src/actions/system.actions';
import { DesktopLoginComponent } from './desktop-login/desktop-login.component';
import { ElectronService } from './electron/electron.service';

@NgModule({
  declarations: [
    DesktopLoginComponent,
  ],
  entryComponents: [
    DesktopLoginComponent
  ],
  providers: [
    ElectronService,
  ]
})
export class DesktopModule {

  static init = false;

  constructor(
    router: Router,
    private pElectronService: ElectronService,
    private store: Store) {
    // Only update the routes once
    if (!DesktopModule.init) {
      // Override the component used for the login route
      const routeConfig = [...router.config];
      const loginRoute = routeConfig.find(r => r.path === 'login') || {};
      loginRoute.component = DesktopLoginComponent;
      router.resetConfig(routeConfig);
      DesktopModule.init = true;
      this.initElectron();
    }
  }

  // Listen for events from the Electron host
  private initElectron() {
    if (!this.pElectronService.isElectronApp) {
      return;
    }
    this.pElectronService.ipcRenderer.addListener('endpointsChanged', (sender, args) => {
      console.log('Got an event - endpoints changed');
      console.log(sender);
      console.log(args);
      this.store.dispatch(new GetSystemInfo());
    });
  }
}
