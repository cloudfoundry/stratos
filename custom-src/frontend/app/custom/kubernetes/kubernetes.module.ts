import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { BaseKubeGuid } from './kubernetes-page.types';
import { KubernetesTabBaseComponent } from './kubernetes-tab-base/kubernetes-tab-base.component';
import { KubernetesComponent } from './kubernetes/kubernetes.component';
import { KubernetesEndpointService } from './services/kubernetes-endpoint.service';
import { KubernetesService } from './services/kubernetes.service';
import { KubernetesNodesTabComponent } from './tabs/kubernetes-nodes-tab/kubernetes-nodes-tab.component';
import { KubernetesRoutingModule } from './kubernetes.routing';
import { KubernetesNodeCapacityComponent } from './list-types/kubernetes-nodes/kubernetes-node-capacity/kubernetes-node-capacity.component';
import { ExtensionManager } from '../../core/extension/extension-manager-service';

@NgModule({
  imports: [
    CoreModule,
    CommonModule,
    SharedModule,
    KubernetesRoutingModule,
  ],
  declarations: [KubernetesComponent, KubernetesNodesTabComponent, KubernetesTabBaseComponent, KubernetesNodeCapacityComponent],
  providers: [
    KubernetesService,
    BaseKubeGuid,
    KubernetesEndpointService,
  ]
})
export class KubernetesModule {

  constructor(private ext: ExtensionManager) {

    console.log('Caasp Setup Module init');

    ext.registerSideNav({
      text: 'Kubernetes',
      matIcon: 'apps',
      link: '/kubernetes'
    }).registerEndpointType({
      type: 'k8s',
      label: 'Kubernetes',
      authTypes: ['creds']
    });

  }
}

