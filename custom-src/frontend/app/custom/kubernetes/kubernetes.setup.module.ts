import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ExtensionManager } from '../../core/extension/extension-manager-service';


const kubernetes: Routes = [{
  path: 'kubernetes', loadChildren: 'app/custom/kubernetes/kubernetes.module#KubernetesModule'
}];

@NgModule({
  imports: [RouterModule.forChild(kubernetes)]
})
export class KubernetesSetupRoutesModule { }

@NgModule({
  imports: [
    KubernetesSetupRoutesModule,
    // KubernetesModule,
    // KubernetesRoutingModule,
  ]
})
export class KubernetesSetupModule {

  constructor(private ext: ExtensionManager) {

    console.log('Kubernetes Module init');

    ext.registerRoutes(kubernetes);

    ext.registerSideNav({
      text: 'Kubernetes',
      matIcon: 'apps',
      link: '/kubernetes'
    }).registerEndpointType({
      type: 'k8s',
      label: 'Kubernetes',
      authTypes: ['kubeconfig']
    });

  }
}


