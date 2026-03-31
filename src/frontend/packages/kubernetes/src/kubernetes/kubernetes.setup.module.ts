import { CommonModule } from '@angular/common';
import { NgModule, inject } from '@angular/core';

import { CoreModule, SharedModule } from '@stratosui/core';
import { EndpointsService } from '../../../core/src/core/endpoints.service';
import { EntityCatalogModule } from '../../../store/src/entity-catalog.module';
import { EndpointHealthCheck } from '../../../store/src/entity-catalog/entity-catalog.types';
import { KubernetesAWSAuthFormComponent } from './auth-forms/kubernetes-aws-auth-form/kubernetes-aws-auth-form.component';
import {
  KubernetesCertsAuthFormComponent,
} from './auth-forms/kubernetes-certs-auth-form/kubernetes-certs-auth-form.component';
import {
  KubernetesConfigAuthFormComponent,
} from './auth-forms/kubernetes-config-auth-form/kubernetes-config-auth-form.component';
import { KubernetesGKEAuthFormComponent } from './auth-forms/kubernetes-gke-auth-form/kubernetes-gke-auth-form.component';
import {
  KubernetesSATokenAuthFormComponent,
} from './auth-forms/kubernetes-serviceaccount-auth-form/kubernetes-serviceaccount-auth-form.component';
import { KubeConfigImportComponent } from './kube-config-registration/kube-config-import/kube-config-import.component';
import {
  KubeConfigTableImportStatusComponent,
} from './kube-config-registration/kube-config-import/kube-config-table-import-status/kube-config-table-import-status.component';
import { KubeConfigRegistrationComponent } from './kube-config-registration/kube-config-registration.component';
import {
  KubeConfigSelectionComponent,
} from './kube-config-registration/kube-config-selection/kube-config-selection.component';
import {
  KubeConfigTableCertComponent,
} from './kube-config-registration/kube-config-selection/kube-config-table-cert/kube-config-table-cert.component';
import {
  KubeConfigTableNameComponent,
} from './kube-config-registration/kube-config-selection/kube-config-table-name/kube-config-table-name.component';
import {
  KubeConfigTableSelectComponent,
} from './kube-config-registration/kube-config-selection/kube-config-table-select/kube-config-table-select.component';
import {
  KubeConfigTableSubTypeSelectComponent,
} from './kube-config-registration/kube-config-selection/kube-config-table-sub-type-select/kube-config-table-sub-type-select.component';
import {
  KubeConfigTableUserSelectComponent,
} from './kube-config-registration/kube-config-selection/kube-config-table-user-select/kube-config-table-user-select.component';
import { KUBERNETES_ENDPOINT_TYPE, kubernetesNamespacesEntityType } from './kubernetes-entity-factory';
import { kubeEntityCatalog } from './kubernetes-entity-generator';
import { KubernetesListConfigService } from './kubernetes-list-service';
import {
  KubernetesNamespacePreviewComponent,
} from './kubernetes-namespace/kubernetes-namespace-preview/kubernetes-namespace-preview.component';
import { KubernetesPodsListConfig } from './list-types/kubernetes-pods/kubernetes-pods-list-config.service';
import { KubernetesServicesListConfig } from './list-types/kubernetes-services/kubernetes-service-list-config.service';
import { BaseKubeGuid } from './kubernetes-page.types';
import { KubernetesUIConfigService } from './kubernetes-ui-service';
import { KubernetesStoreModule } from './kubernetes.store.module';
import { KubernetesEndpointService } from './services/kubernetes-endpoint.service';
import { KubernetesNodeService } from './services/kubernetes-node.service';
import { KubernetesService } from './services/kubernetes.service';

@NgModule({
    imports: [
        EntityCatalogModule.forFeature(() => kubeEntityCatalog.allKubeEntities()),
        CoreModule,
        CommonModule,
        SharedModule,
        KubernetesStoreModule,
        // Standalone auth form components
        KubernetesCertsAuthFormComponent,
        KubernetesAWSAuthFormComponent,
        KubernetesConfigAuthFormComponent,
        KubernetesGKEAuthFormComponent,
        KubernetesSATokenAuthFormComponent,
        // Standalone KubeConfig components
        KubeConfigRegistrationComponent,
        KubeConfigSelectionComponent,
        KubeConfigImportComponent,
        KubeConfigTableSelectComponent,
        KubeConfigTableUserSelectComponent,
        KubeConfigTableImportStatusComponent,
        KubeConfigTableSubTypeSelectComponent,
        KubeConfigTableNameComponent,
        KubeConfigTableCertComponent
    ],
    declarations: [
    ],
    providers: [
        BaseKubeGuid,
        KubernetesEndpointService,
        KubernetesNodeService,
        KubernetesService,
        KubernetesUIConfigService,
    ]
})
export class KubernetesSetupModule {
  constructor() {
    const endpointService = inject(EndpointsService);
    const uiConfigService = inject(KubernetesUIConfigService);
    const parentModule = inject(KubernetesSetupModule, { optional: true, skipSelf: true });

    if (parentModule) {
      // Module has already been imported
    } else {
      endpointService.registerHealthCheck(
        new EndpointHealthCheck(KUBERNETES_ENDPOINT_TYPE, (endpoint) => kubeEntityCatalog.node.api.healthCheck(endpoint.guid))
      );

      // Configure UI services (from KubernetesModule)
      uiConfigService.listConfig.set('k8s-pods', new KubernetesPodsListConfig());
      uiConfigService.listConfig.set('k8s-services', new KubernetesServicesListConfig());
      uiConfigService.previewComponent.set(kubernetesNamespacesEntityType, KubernetesNamespacePreviewComponent);
    }
  }
}
