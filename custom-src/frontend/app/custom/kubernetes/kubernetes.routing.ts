import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { KubernetesTabBaseComponent } from './kubernetes-tab-base/kubernetes-tab-base.component';
import { KubernetesComponent } from './kubernetes/kubernetes.component';
import { KubernetesNodesTabComponent } from './tabs/kubernetes-nodes-tab/kubernetes-nodes-tab.component';

const kubernetes: Routes = [{
  path: '',
  component: KubernetesComponent
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
  ]
}];

@NgModule({
  imports: [RouterModule.forChild(kubernetes)]
})
export class KubernetesRoutingModule { }
