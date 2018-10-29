import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { StratosExtension } from '../../core/extension/extension-service';
import { EndpointTypeConfig } from '../../features/endpoints/endpoint-helpers';

const kubernetes: Routes = [{
  path: 'kubernetes',
  loadChildren: 'app/custom/kubernetes/kubernetes.module#KubernetesModule',
  data: {
    stratosNavigation: {
      text: 'Kubernetes',
      matIcon: 'kubernetes',
      matIconFont: 'stratos-icons',
      position: 60,
      requiresEndpointType: 'k8s'
    }
  }
}];

const kubernetesEndpointTypes: EndpointTypeConfig[] = [{
  value: 'kubernetes',
  label: 'Kubernetes',
  authTypes: ['kubeconfig'],
  icon: 'kubernetes',
  iconFont: 'stratos-icons'
}];

@StratosExtension({
  endpointTypes: kubernetesEndpointTypes
})
@NgModule({
  imports: [
    RouterModule.forChild(kubernetes)
  ]
})
export class KubernetesSetupModule { }
