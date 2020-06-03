import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HELM_ENDPOINT_TYPE } from './helm/helm-entity-factory';
import { KUBERNETES_ENDPOINT_TYPE } from './kubernetes/kubernetes-entity-factory';

const customRoutes: Routes = [
  {
    path: 'workloads',
    loadChildren: () => import('./kubernetes/workloads/workloads.module').then(m => m.WorkloadsModule),
    data: {
      reuseRoute: true,
      stratosNavigation: {
        text: 'Workloads',
        matIcon: 'workloads',
        matIconFont: 'stratos-icons',
        position: 60,
        requiresEndpointType: KUBERNETES_ENDPOINT_TYPE
      }
    }
  },
  {
    path: 'kubernetes',
    loadChildren: () => import('./kubernetes/kubernetes.module').then(m => m.KubernetesModule),
    data: {
      stratosNavigation: {
        text: 'Kubernetes',
        matIcon: 'kubernetes',
        matIconFont: 'stratos-icons', // TODO: get these from entity config?
        position: 64,
        requiresEndpointType: KUBERNETES_ENDPOINT_TYPE
      }
    }
  },
  {
    path: 'monocular',
    loadChildren: () => import('./helm/helm.module').then(m => m.HelmModule),
    data: {
      reuseRoute: true,
      stratosNavigation: {
        text: 'Helm',
        matIcon: 'helm',
        matIconFont: 'stratos-icons',
        position: 65,
        requiresEndpointType: HELM_ENDPOINT_TYPE
      }
    }
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(customRoutes),
  ],
  declarations: []
})
export class CustomRoutingModule { }
