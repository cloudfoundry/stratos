import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ExtensionManager } from '../../core/extension/extension-manager-service';


const caasp: Routes = [{
  path: 'caasp', loadChildren: 'app/custom/caasp/caasp.module#CaaspModule'
}];

@NgModule({
  imports: [RouterModule.forChild(caasp)]
})
export class CaaspSetupRoutesModule { }

@NgModule({
  imports: [
    CaaspSetupRoutesModule
    // CaaspModule,
    // CaaspRoutingModule,
  ]
})
export class CaaspSetupModule {

  constructor(private ext: ExtensionManager) {

    console.log('Caasp Setup Module init');

    // Register CaasSP extension points

    ext.registerRoutes(caasp);

    ext.registerSideNav({
      text: 'CaaSP',
      matIcon: 'apps',
      link: '/caasp'
    }).registerEndpointType({
      type: 'caasp',
      label: 'SUSE CaaSP',
      authTypes: ['creds']
    });

  }
}


