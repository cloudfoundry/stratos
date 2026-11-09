import { Routes } from '@angular/router';
import { tabTitle } from '@stratosui/core';
import { kubeEndpointTitle, nodeTitle, podTitle } from './route-titles';

import { KubeConsoleComponent } from './kube-terminal/kube-console.component';
import {
  KubedashConfigurationComponent,
} from './kubernetes-dashboard/kubedash-configuration/kubedash-configuration.component';
import { KubernetesDashboardTabComponent } from './kubernetes-dashboard/kubernetes-dashboard.component';
import {
  KubernetesNamespaceAnalysisReportComponent,
} from './kubernetes-namespace/kubernetes-namespace-analysis-report/kubernetes-namespace-analysis-report.component';
import { KubernetesNodeMetricsComponent } from './kubernetes-node/kubernetes-node-metrics/kubernetes-node-metrics.component';
import { KubernetesNodePodsComponent } from './kubernetes-node/kubernetes-node-pods/kubernetes-node-pods.component';
import { KubernetesNodeComponent } from './kubernetes-node/kubernetes-node.component';
import { KubernetesTabBaseComponent } from './kubernetes-tab-base/kubernetes-tab-base.component';
import { KubernetesComponent } from './kubernetes/kubernetes.component';
import {
  KubernetesNodeSummaryComponent,
} from './list-types/kubernetes-nodes/kubernetes-node-summary/kubernetes-node-summary.component';
import { PodMetricsComponent } from './pod-metrics/pod-metrics.component';
import {
  KubernetesAnalysisInfoComponent,
} from './tabs/kubernetes-analysis-tab/kubernetes-analysis-info/kubernetes-analysis-info.component';
import {
  KubernetesAnalysisReportComponent,
} from './tabs/kubernetes-analysis-tab/kubernetes-analysis-report/kubernetes-analysis-report.component';
import { KubernetesAnalysisTabComponent } from './tabs/kubernetes-analysis-tab/kubernetes-analysis-tab.component';
import { KubernetesNamespacesTabComponent } from './tabs/kubernetes-namespaces-tab/kubernetes-namespaces-tab.component';
import { KubernetesNodesTabComponent } from './tabs/kubernetes-nodes-tab/kubernetes-nodes-tab.component';
import { KubernetesSummaryTabComponent } from './tabs/kubernetes-summary-tab/kubernetes-summary.component';

export const KUBERNETES_ROUTES: Routes = [{
  path: '',
  component: KubernetesComponent
},
{
  path: ':endpointId/nodes/:nodeName/pods/:namespace/:podName',
  title: podTitle,
  component: PodMetricsComponent,
},
{
  path: ':endpointId/pods/:namespace/:podName',
  title: podTitle,
  component: PodMetricsComponent,
},
{
  path: ':endpointId/namespaces/:namespaceName/pods/:podName',
  title: podTitle,
  component: PodMetricsComponent
},
{
  path: ':endpointId/nodes/:nodeName',
  title: nodeTitle,
  component: KubernetesNodeComponent,
  children: [
    {
      path: '',
      redirectTo: 'summary',
      pathMatch: 'full'
    },
    {
      path: 'summary',
      title: tabTitle('Summary'),
      component: KubernetesNodeSummaryComponent
    },
    {
      path: 'pods',
      title: tabTitle('Pods'),
      component: KubernetesNodePodsComponent
    },
    {
      path: 'metrics',
      title: tabTitle('Metrics'),
      component: KubernetesNodeMetricsComponent
    }
  ]
},
{
  path: ':endpointId',
  title: kubeEndpointTitle,
  component: KubernetesTabBaseComponent,
  children: [
    {
      path: '',
      redirectTo: 'summary',
      pathMatch: 'full'
    },
    {
      path: 'summary',
      title: tabTitle('Summary'),
      component: KubernetesSummaryTabComponent
    },
    {
      path: 'nodes',
      title: tabTitle('Nodes'),
      component: KubernetesNodesTabComponent
    },
    {
      path: 'namespaces',
      title: tabTitle('Namespaces'),
      component: KubernetesNamespacesTabComponent
    },
    {
      path: 'analysis',
      title: tabTitle('Analysis'),
      component: KubernetesAnalysisTabComponent
    },
    {
      path: 'analysis/report/:id',
      title: tabTitle('Analysis Report'),
      component: KubernetesAnalysisReportComponent
    },
    {
      path: 'analysis/info',
      title: tabTitle('Analysis Info'),
      component: KubernetesAnalysisInfoComponent
    },
    {
      path: 'resource/namespace/:namespaceName/analysis',
      title: tabTitle('Namespace Analysis'),
      pathMatch: 'full',
      component: KubernetesNamespaceAnalysisReportComponent
    },
    {
      path: 'resource/:resource',
      loadChildren: () => import('./kubernetes-resource/generic-resource.routes').then(m => m.GENERIC_RESOURCE_ROUTES),
    },

  ]
},
{
  path: ':endpointId/dashboard',
  title: 'Dashboard',
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
  title: 'Dashboard Configuration',
  component: KubedashConfigurationComponent,
},
{
  path: ':endpointId/terminal',
  title: 'Kubernetes Terminal',
  component: KubeConsoleComponent,
  data: {
    uiNoMargin: true
  }
}
];
