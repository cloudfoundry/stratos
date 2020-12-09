import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { KubernetesResourceListComponent } from './kubernetes-resource-list/kubernetes-resource-list.component';

const genericResource: Routes = [{
  path: '',
  component: KubernetesResourceListComponent
}];

@NgModule({
  imports: [RouterModule.forChild(genericResource)]
})
export class KubernetesResourceRoutingModule { }
