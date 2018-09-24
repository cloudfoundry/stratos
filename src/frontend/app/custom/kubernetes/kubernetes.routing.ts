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

const kubernetes: Routes = [{
  path: '',
  component: KubernetesComponent
},
{
  path: ':kubeId/apps/:releaseName/:namespaceName/pods/:podName',
  component: HelmReleasePodComponent,
  data: {
    uiFullView: true
  },
},
{
  path: ':kubeId/nodes/:nodeUid',
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
      component: HelmReleaseSummaryComponent
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
  path: ':kubeId/apps/:releaseName/:namespaceName',
  // pathMatch: 'full',
  component: HelmReleaseComponent,
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
      component: HelmReleaseSummaryComponent
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
