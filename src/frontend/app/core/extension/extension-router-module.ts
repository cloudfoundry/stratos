import { Injectable, ModuleWithProviders, ReflectiveInjector } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ExtensionManager } from './extension-manager-service';

@Injectable()
export class ExtensionRouterModule {

  static forRoot(routes: Routes): ModuleWithProviders {

    const injector = ReflectiveInjector.resolveAndCreate([ExtensionManager]);
    const ext = injector.get(ExtensionManager);

    const v = routes.find(r => {
      return r.path === '' && !!r.children;
    });

    v.children = [
      ...v.children,
      ...ext.routes
    ];

    return RouterModule.forRoot(routes);

  }

}
