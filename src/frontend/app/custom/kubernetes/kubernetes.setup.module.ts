import { NgModule } from '@angular/core';

import { StratosExtension } from '../../core/extension/extension-service';
import { EndpointTypeConfig } from '../../features/endpoints/endpoint-helpers';

const kubernetesEndpointTypes: EndpointTypeConfig[] = [{
  value: 'k8s',
  label: 'Kubernetes',
  authTypes: ['kubeconfig'],
  icon: 'kubernetes',
  iconFont: 'stratos-icons'
}];

@StratosExtension({
  endpointTypes: kubernetesEndpointTypes
})
@NgModule()
export class KubernetesSetupModule { }
