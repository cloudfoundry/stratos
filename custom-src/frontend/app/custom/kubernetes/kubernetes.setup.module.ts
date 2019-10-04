import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../store/src/app-state';
import { EndpointHealthCheck } from '../../../endpoints-health-checks';
import { CoreModule } from '../../core/core.module';
import { EndpointsService } from '../../core/endpoints.service';
import { EntityCatalogueModule } from '../../core/entity-catalogue.module';
import { SharedModule } from '../../shared/shared.module';
import { KubernetesAWSAuthFormComponent } from './auth-forms/kubernetes-aws-auth-form/kubernetes-aws-auth-form.component';
import {
  KubernetesCertsAuthFormComponent,
} from './auth-forms/kubernetes-certs-auth-form/kubernetes-certs-auth-form.component';
import {
  KubernetesConfigAuthFormComponent,
} from './auth-forms/kubernetes-config-auth-form/kubernetes-config-auth-form.component';
import { KubernetesGKEAuthFormComponent } from './auth-forms/kubernetes-gke-auth-form/kubernetes-gke-auth-form.component';
import { KUBERNETES_ENDPOINT_TYPE } from './kubernetes-entity-factory';
import { generateKubernetesEntities } from './kubernetes-entity-generator';
import { KubernetesStoreModule } from './kubernetes.store.module';
import { KubeHealthCheck } from './store/kubernetes.actions';


@NgModule({
  imports: [
    // TODO: RC Every time this is imported it's executed. See note & `hack` in `generateKubernetesEntities`
    EntityCatalogueModule.forFeature(generateKubernetesEntities),
    CoreModule,
    CommonModule,
    SharedModule,
    KubernetesStoreModule,
  ],
  declarations: [
    KubernetesCertsAuthFormComponent,
    KubernetesAWSAuthFormComponent,
    KubernetesConfigAuthFormComponent,
    KubernetesGKEAuthFormComponent,
  ],
  entryComponents: [
    KubernetesCertsAuthFormComponent,
    KubernetesAWSAuthFormComponent,
    KubernetesConfigAuthFormComponent,
    KubernetesGKEAuthFormComponent,
  ]
})
export class KubernetesSetupModule {
  constructor(endpointService: EndpointsService, store: Store<AppState>) {
    endpointService.registerHealthCheck(
      new EndpointHealthCheck(KUBERNETES_ENDPOINT_TYPE, (endpoint) => store.dispatch(new KubeHealthCheck(endpoint.guid)))
    );
  }
}
