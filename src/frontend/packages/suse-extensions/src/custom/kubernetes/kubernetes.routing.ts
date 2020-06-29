import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { KubernetesDashboardTabComponent } from './kubernetes-dashboard/kubernetes-dashboard.component';
import {
  KubernetesNamespacePodsComponent,
} from './kubernetes-namespace/kubernetes-namespace-pods/kubernetes-namespace-pods.component';
import {
  KubernetesNamespaceServicesComponent,
} from './kubernetes-namespace/kubernetes-namespace-services/kubernetes-namespace-services.component';
import { KubernetesNamespaceComponent } from './kubernetes-namespace/kubernetes-namespace.component';
import { KubernetesNodeMetricsComponent } from './kubernetes-node/kubernetes-node-metrics/kubernetes-node-metrics.component';
import { KubernetesNodePodsComponent } from './kubernetes-node/kubernetes-node-pods/kubernetes-node-pods.component';
import { KubernetesNodeComponent } from './kubernetes-node/kubernetes-node.component';
import { KubernetesTabBaseComponent } from './kubernetes-tab-base/kubernetes-tab-base.component';
import { KubernetesComponent } from './kubernetes/kubernetes.component';
import {
  KubernetesNodeSummaryComponent,
} from './list-types/kubernetes-nodes/kubernetes-node-summary/kubernetes-node-summary.component';
import { PodMetricsComponent } from './pod-metrics/pod-metrics.component';
import { KubernetesNamespacesTabComponent } from './tabs/kubernetes-namespaces-tab/kubernetes-namespaces-tab.component';
import { KubernetesNodesTabComponent } from './tabs/kubernetes-nodes-tab/kubernetes-nodes-tab.component';
import { KubernetesPodsTabComponent } from './tabs/kubernetes-pods-tab/kubernetes-pods-tab.component';
import { KubernetesSummaryTabComponent } from './tabs/kubernetes-summary-tab/kubernetes-summary.component';
import { KubedashConfigurationComponent } from './kubernetes-dashboard/kubedash-configuration/kubedash-configuration.component';
import { KubeConsoleComponent } from './kube-terminal/kube-console.component';

const kubernetes: Routes = [{
  path: '',
  component: KubernetesComponent
},
{
  path: ':endpointId/nodes/:nodeName/pods/:namespace/:podName',
  component: PodMetricsComponent,
},
{
  path: ':endpointId/pods/:namespace/:podName',
  component: PodMetricsComponent,
},
{
  path: ':endpointId/namespaces/:namespaceName/pods/:podName',
  component: PodMetricsComponent
},
{
  path: ':endpointId/nodes/:nodeName',
  component: KubernetesNodeComponent,
  children: [
    {
      path: '',
      redirectTo: 'summary',
      pathMatch: 'full'
    },
    {
      path: 'summary',
      component: KubernetesNodeSummaryComponent
    },
    {
      path: 'pods',
      component: KubernetesNodePodsComponent
    },
    {
      path: 'metrics',
      component: KubernetesNodeMetricsComponent
    }
  ]
},
{
  path: ':endpointId/namespaces/:namespaceName',
  component: KubernetesNamespaceComponent,
  children: [
    {
      path: '',
      redirectTo: 'pods',
      pathMatch: 'full'
    },
    {
      path: 'pods',
      component: KubernetesNamespacePodsComponent
    },
    {
      path: 'services',
      component: KubernetesNamespaceServicesComponent
    },

  ]
},
{
  path: ':endpointId',
  component: KubernetesTabBaseComponent,
  children: [
    {
      path: '',
      redirectTo: 'summary',
      pathMatch: 'full'
    },
    {
      path: 'summary',
      component: KubernetesSummaryTabComponent
    },
    {
      path: 'nodes',
      component: KubernetesNodesTabComponent
    },
    {
      path: 'namespaces',
      component: KubernetesNamespacesTabComponent
    },
    {
      path: 'pods',
      component: KubernetesPodsTabComponent
    },
  ]
},
{
  path: ':endpointId/dashboard',
  component: KubernetesDashboardTabComponent,
  data: {
    uiNoMargin: true
  },
  children: [
    {
      path: '**',
      component: KubernetesDashboardTabComponent,
      data: {
        uiNoMargin: true
      }
    }
  ]
},
{
  path: ':endpointId/dashboard-config',
  component: KubedashConfigurationComponent,
},
{
  path: ':endpointId/terminal',
  component: KubeConsoleComponent,
  data: {
    uiNoMargin: true
  }
}
];

@NgModule({
  imports: [RouterModule.forChild(kubernetes)]
})
export class KubernetesRoutingModule { }
