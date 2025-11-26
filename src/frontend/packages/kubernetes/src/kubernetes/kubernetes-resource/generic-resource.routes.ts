import type { Routes } from '@angular/router';

import { KubernetesResourceListComponent } from './kubernetes-resource-list/kubernetes-resource-list.component';

export const GENERIC_RESOURCE_ROUTES: Routes = [{
  path: '',
  component: KubernetesResourceListComponent
}];
