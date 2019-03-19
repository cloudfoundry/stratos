import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import {
  HelmReleasePodsTabComponent,
} from './helm-release/helm-release-pods-tab/helm-release-pods-tab.component';
import { HelmReleaseComponent } from './helm-release/helm-release.component';
import { PodMetricsComponent } from './pod-metrics/pod-metrics.component';
import {
  HelmReleaseServicesComponent,
} from './helm-release/helm-release-services/helm-release-services.component';
import {
  HelmReleaseSummaryComponent,
} from './helm-release/helm-release-summary/helm-release-summary.component';
import { KubernetesTabBaseComponent } from './kubernetes-tab-base/kubernetes-tab-base.component';
import { KubernetesComponent } from './kubernetes/kubernetes.component';
import { KubernetesAppsTabComponent } from './tabs/kubernetes-apps-tab/kubernetes-apps-tab.component';
import { KubernetesNamespacesTabComponent } from './tabs/kubernetes-namespaces-tab/kubernetes-namespaces-tab.component';
import { KubernetesNodesTabComponent } from './tabs/kubernetes-nodes-tab/kubernetes-nodes-tab.component';
import { KubernetesPodsTabComponent } from './tabs/kubernetes-pods-tab/kubernetes-pods-tab.component';
import { KubernetesNodeComponent } from './kubernetes-node/kubernetes-node.component';
import { KubernetesNodeSummaryComponent } from './list-types/kubernetes-nodes/kubernetes-node-summary/kubernetes-node-summary.component';
import { KubernetesNodePodsComponent } from './kubernetes-node/kubernetes-node-pods/kubernetes-node-pods.component';
import { KubernetesNodeMetricsComponent } from './kubernetes-node/kubernetes-node-metrics/kubernetes-node-metrics.component';
import { KubernetesNamespaceComponent } from './kubernetes-namespace/kubernetes-namespace.component';
import { KubernetesNamespacePodsComponent } from './kubernetes-namespace/kubernetes-namespace-pods/kubernetes-namespace-pods.component';
import { KubernetesDashboardTabComponent } from './kubernetes-dashboard/kubernetes-dashboard.component';
import { KubernetesSummaryTabComponent } from './tabs/kubernetes-summary-tab/kubernetes-summary.component';

const kubernetes: Routes = [{
  path: '',
  component: KubernetesComponent
},
{
  path: ':endpointId/apps/:releaseName/pods/:namespace/:podName',
  component: PodMetricsComponent,
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
  data: {
    uiFullView: true
  },
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
  data: {
    uiFullView: true
  },
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
  ]
},
{
  path: ':endpointId/apps/:releaseName',
  component: HelmReleaseComponent,
  data: {
    uiFullView: true
  },
  children: [
    {
      path: '',
      redirectTo: 'pods',
      pathMatch: 'full'
    },
    {
      path: 'pods',
      component: HelmReleasePodsTabComponent
    },
    {
      path: 'services',
      component: HelmReleaseServicesComponent
    }
  ]
},
{
  path: ':endpointId',
  component: KubernetesTabBaseComponent,
  data: {
    uiFullView: true
  },
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
    {
      path: 'apps',
      component: KubernetesAppsTabComponent,
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
}
];

@NgModule({
  imports: [RouterModule.forChild(kubernetes)]
})
export class KubernetesRoutingModule { }
