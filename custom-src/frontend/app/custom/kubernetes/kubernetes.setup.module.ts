import { CommonModule } from '@angular/common';
import { NgModule, Optional, SkipSelf } from '@angular/core';

import { EntityCatalogModule } from '../../../../store/src/entity-catalog.module';
import { EndpointHealthCheck } from '../../../endpoints-health-checks';
import { CoreModule } from '../../core/core.module';
import { EndpointsService } from '../../core/endpoints.service';
import { SharedModule } from '../../shared/shared.module';
import { KubernetesAWSAuthFormComponent } from './auth-forms/kubernetes-aws-auth-form/kubernetes-aws-auth-form.component';
import {
  KubernetesCertsAuthFormComponent,
} from './auth-forms/kubernetes-certs-auth-form/kubernetes-certs-auth-form.component';
import {
  KubernetesConfigAuthFormComponent,
} from './auth-forms/kubernetes-config-auth-form/kubernetes-config-auth-form.component';
import { KubernetesGKEAuthFormComponent } from './auth-forms/kubernetes-gke-auth-form/kubernetes-gke-auth-form.component';
import { kubeEntityCatalog } from './kubernetes-entity-catalog';
import { KUBERNETES_ENDPOINT_TYPE } from './kubernetes-entity-factory';
import { generateKubernetesEntities } from './kubernetes-entity-generator';
import { BaseKubeGuid } from './kubernetes-page.types';
import { KubernetesStoreModule } from './kubernetes.store.module';
import { KubernetesEndpointService } from './services/kubernetes-endpoint.service';


@NgModule({
  imports: [
    EntityCatalogModule.forFeature(generateKubernetesEntities),
    CoreModule,
    CommonModule,
    SharedModule,
    KubernetesStoreModule
  ],
  declarations: [
    KubernetesCertsAuthFormComponent,
    KubernetesAWSAuthFormComponent,
    KubernetesConfigAuthFormComponent,
    KubernetesGKEAuthFormComponent,
  ],
  providers: [
    BaseKubeGuid,
    KubernetesEndpointService,
  ],
  entryComponents: [
    KubernetesCertsAuthFormComponent,
    KubernetesAWSAuthFormComponent,
    KubernetesConfigAuthFormComponent,
    KubernetesGKEAuthFormComponent,
  ]
})
export class KubernetesSetupModule {
  constructor(
    endpointService: EndpointsService,
    @Optional() @SkipSelf() parentModule: KubernetesSetupModule
  ) {
    if (parentModule) {
      // Module has already been imported
    } else {
      endpointService.registerHealthCheck(
        new EndpointHealthCheck(KUBERNETES_ENDPOINT_TYPE, (endpoint) => kubeEntityCatalog.node.api.healthCheck(endpoint.guid))
      );
    }
  }
}
