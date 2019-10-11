import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HELM_ENDPOINT_TYPE } from './helm/helm-entity-factory';
import { KUBERNETES_ENDPOINT_TYPE } from './kubernetes/kubernetes-entity-factory';

const kubernetes: Routes = [
  {
    path: 'kubernetes',
    loadChildren: './kubernetes/kubernetes.module#KubernetesModule',
    data: {
      stratosNavigation: {
        text: 'Kubernetes',
        matIcon: 'kubernetes',
        matIconFont: 'stratos-icons', // TODO: get these from entity config?
        position: 60,
        requiresEndpointType: KUBERNETES_ENDPOINT_TYPE
      }
    }
  },
  {
    path: 'monocular',
    loadChildren: './helm/helm.module#HelmModule',
    data: {
      stratosNavigation: {
        text: 'Helm',
        matIcon: 'helm',
        matIconFont: 'stratos-icons',
        position: 65,
        requiresEndpointType: HELM_ENDPOINT_TYPE
      }
    }
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(kubernetes),
  ],
  declarations: []
})
export class CustomRoutingModule { }
