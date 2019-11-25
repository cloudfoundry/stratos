import { CommonModule } from '@angular/common';
import { NgModule, Optional, SkipSelf } from '@angular/core';
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
import { KubernetesNodeCapacityComponent } from './list-types/kubernetes-nodes/kubernetes-node-capacity/kubernetes-node-capacity.component';
import { KubernetesPodTagsComponent } from './list-types/kubernetes-pods/kubernetes-pod-tags/kubernetes-pod-tags.component';
import { AppLinkComponent } from './list-types/kubernetes-apps/app-link/app-link.component';
import { KubernetesNodeLinkComponent } from './list-types/kubernetes-nodes/kubernetes-node-link/kubernetes-node-link.component';
import { KubernetesNodeIpsComponent } from './list-types/kubernetes-nodes/kubernetes-node-ips/kubernetes-node-ips.component';
import { KubernetesNodeLabelsComponent } from './list-types/kubernetes-nodes/kubernetes-node-labels/kubernetes-node-labels.component';
import { KubernetesNodePressureComponent } from './list-types/kubernetes-nodes/kubernetes-node-pressure/kubernetes-node-pressure.component';
import { KubernetesLabelsCellComponent } from './list-types/kubernetes-labels-cell/kubernetes-labels-cell.component';
import { ConditionCellComponent } from './list-types/kubernetes-nodes/condition-cell/condition-cell.component';
import { KubernetesNamespaceLinkComponent } from './list-types/kubernetes-namespaces/kubernetes-namespace-link/kubernetes-namespace-link.component';
import { KubeAppcreatedDateComponent } from './list-types/kubernetes-apps/kube-appcreated-date/kube-appcreated-date.component';
import { KubeNamespacePodCountComponent } from './list-types/kubernetes-namespaces/kube-namespace-pod-count/kube-namespace-pod-count.component';
import { PodNameLinkComponent } from './list-types/kubernetes-pods/pod-name-link/pod-name-link.component';
import { NodePodCountComponent } from './list-types/kubernetes-nodes/node-pod-count/node-pod-count.component';
import { KubernetesServicePortsComponent } from './list-types/kubernetes-service-ports/kubernetes-service-ports.component';


@NgModule({
  imports: [
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
    KubernetesNodeCapacityComponent,
    KubernetesPodTagsComponent,
    AppLinkComponent,
    KubernetesNodeLinkComponent,
    KubernetesNodeIpsComponent,
    KubernetesNodeLabelsComponent,
    KubernetesNodePressureComponent,
    KubernetesLabelsCellComponent,
    ConditionCellComponent,
    KubernetesNamespaceLinkComponent,
    KubeAppcreatedDateComponent,
    KubeNamespacePodCountComponent,
    PodNameLinkComponent,
    NodePodCountComponent,
    KubernetesServicePortsComponent,
    KubernetesCertsAuthFormComponent,
    KubernetesAWSAuthFormComponent,
    KubernetesConfigAuthFormComponent,
    KubernetesGKEAuthFormComponent,
  ]
})
export class KubernetesSetupModule {
  constructor(
    endpointService: EndpointsService,
    store: Store<AppState>,
    @Optional() @SkipSelf() parentModule: KubernetesSetupModule
  ) {
    if (parentModule) {
      // Module has already been imported
    } else {
      endpointService.registerHealthCheck(
        new EndpointHealthCheck(KUBERNETES_ENDPOINT_TYPE, (endpoint) => store.dispatch(new KubeHealthCheck(endpoint.guid)))
      );
    }
  }
}
