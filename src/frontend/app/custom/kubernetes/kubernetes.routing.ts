import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import {
  HelmReleasePodsTabComponent,
} from './helm-release/helm-release-tabs-base/helm-release-pods-tab/helm-release-pods-tab.component';
import { HelmReleaseComponent } from '../../../../../src/frontend/app/custom/kubernetes/helm-release/helm-release.component';
import { HelmReleasePodComponent } from './helm-release-pod/helm-release-pod.component';
import {
  HelmReleaseServicesComponent,
} from './helm-release/helm-release-tabs-base/helm-release-services/helm-release-services.component';
import {
  HelmReleaseSummaryComponent,
} from './helm-release/helm-release-tabs-base/helm-release-summary/helm-release-summary.component';
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
const kubernetes: Routes = [{
  path: '',
  component: KubernetesComponent
},
{
  path: ':kubeId/apps/:releaseName/pods/:namespace/:podName',
  component: HelmReleasePodComponent,
  data: {
    uiFullView: true
  },
},
{
  path: ':kubeId/nodes/:nodeName/pods/:namespace/:podName',
  component: HelmReleasePodComponent,
  data: {
    uiFullView: true
  },
},
{
  path: ':kubeId/pods/:namespace/:podName',
  component: HelmReleasePodComponent,
  data: {
    uiFullView: true
  },
},
{
  path: ':kubeId/namespaces/:namespaceName/pods/:podName',
  component: HelmReleasePodComponent,
  data: {
    uiFullView: true
  },
},
{
  path: ':kubeId/nodes/:nodeName',
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
  path: ':kubeId/namespaces/:namespaceName',
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
  path: ':kubeId/apps/:releaseName',
  // pathMatch: 'full',
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
  path: ':kubeId',
  component: KubernetesTabBaseComponent,
  data: {
    uiFullView: true
  },
  children: [
    {
      path: '',
      redirectTo: 'nodes',
      pathMatch: 'full'
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
}];

@NgModule({
  imports: [RouterModule.forChild(kubernetes)]
})
export class KubernetesRoutingModule { }
