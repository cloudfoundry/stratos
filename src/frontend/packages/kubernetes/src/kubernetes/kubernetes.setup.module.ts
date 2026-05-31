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
  KubeConfigTableSubTypeSelectComponent,
} from './kube-config-registration/kube-config-selection/kube-config-table-sub-type-select/kube-config-table-sub-type-select.component';
import {
  KubeConfigTableUserSelectComponent,
} from './kube-config-registration/kube-config-selection/kube-config-table-user-select/kube-config-table-user-select.component';
import {
  KUBERNETES_ENDPOINT_TYPE,
  kubernetesConfigMapEntityType,
  kubernetesDeploymentsEntityType,
  kubernetesNamespacesEntityType,
  kubernetesPodsEntityType,
  kubernetesServicesEntityType,
  kubernetesStatefulSetsEntityType,
} from './kubernetes-entity-factory';
import { kubeEntityCatalog } from './kubernetes-entity-generator';

import {
  KubernetesNamespacePreviewComponent,
} from './kubernetes-namespace/kubernetes-namespace-preview/kubernetes-namespace-preview.component';
import { BaseKubeGuid } from './kubernetes-page.types';
import { KubernetesUIConfigService } from './kubernetes-ui-service';
import { KubernetesEndpointService } from './services/kubernetes-endpoint.service';
import { KubernetesNodeService } from './services/kubernetes-node.service';
import { KubernetesService } from './services/kubernetes.service';
import { KubeEndpointRegistryHook } from '../services/endpoint-data/kube-endpoint-registry.hook';
import { KubernetesSignalConfigRegistry } from './kubernetes-resource/kubernetes-signal-config-registry';
import {
  buildClusterRolesSignalConfig,
  buildConfigMapsSignalConfig,
  buildDeploymentsSignalConfig,
  buildJobsSignalConfig,
  buildNamespacesSignalConfig,
  buildPersistentVolumeClaimsSignalConfig,
  buildPersistentVolumesSignalConfig,
  buildPodsSignalConfig,
  buildReplicaSetsSignalConfig,
  buildRolesSignalConfig,
  buildSecretsSignalConfig,
  buildServiceAccountsSignalConfig,
  buildServicesSignalConfig,
  buildStatefulSetsSignalConfig,
  buildStorageClassesSignalConfig,
} from './kubernetes-resource/kubernetes-resource-signal-configs';

@NgModule({
    imports: [
        EntityCatalogModule.forFeature(() => kubeEntityCatalog.allKubeEntities()),
        CoreModule,
        CommonModule,
        SharedModule,
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
        KubeConfigTableUserSelectComponent,
        KubeConfigTableImportStatusComponent,
        KubeConfigTableSubTypeSelectComponent,
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
    const signalRegistry = inject(KubernetesSignalConfigRegistry);
    const parentModule = inject(KubernetesSetupModule, { optional: true, skipSelf: true });
    // Force eager construction of the signal-native registry hook so
    // EndpointsService.endpoints$ is subscribed (and the initial-state
    // diff is computed) before the user navigates into any kubernetes
    // page. Replaces the wave-2 ngrx-Actions bridge.
    inject(KubeEndpointRegistryHook);

    if (parentModule) {
      // Module has already been imported
    } else {
      endpointService.registerHealthCheck(
        new EndpointHealthCheck(KUBERNETES_ENDPOINT_TYPE, (endpoint) => kubeEntityCatalog.node.api.healthCheck(endpoint.guid))
      );

      // Register signal-native list configs for the generic resource
      // shell. Pods / services / namespaces use the wave-2 data services
      // (KubePodDataService / KubeServiceDataService /
      // KubeNamespaceDataService) and bypass the legacy
      // KubernetesUIConfigService.listConfig path. Other resource types
      // (configMap, secret, pvc, etc.) still flow through the legacy
      // ngrx-backed provider until wave-3 lifts them onto data services.
      signalRegistry.register(kubernetesPodsEntityType, buildPodsSignalConfig as any);
      signalRegistry.register(kubernetesServicesEntityType, buildServicesSignalConfig as any);
      signalRegistry.register(kubernetesNamespacesEntityType, buildNamespacesSignalConfig as any);

      // Wave-3: register the 12 generic resource types backed by
      // KubeGenericResourceDataServiceBase subclasses. Constants for
      // configMap / deployment / statefulSet come from kubernetes-entity-factory;
      // the rest use the bare entity-type strings the entity catalog uses
      // directly (matches kubernetes-entity-generator.ts registrations).
      signalRegistry.register(kubernetesConfigMapEntityType, buildConfigMapsSignalConfig as any);
      signalRegistry.register('secrets', buildSecretsSignalConfig as any);
      signalRegistry.register(kubernetesDeploymentsEntityType, buildDeploymentsSignalConfig as any);
      signalRegistry.register('replicaSet', buildReplicaSetsSignalConfig as any);
      signalRegistry.register(kubernetesStatefulSetsEntityType, buildStatefulSetsSignalConfig as any);
      signalRegistry.register('persistentVolume', buildPersistentVolumesSignalConfig as any);
      signalRegistry.register('persistentVolumeClaims', buildPersistentVolumeClaimsSignalConfig as any);
      signalRegistry.register('storageClass', buildStorageClassesSignalConfig as any);
      signalRegistry.register('job', buildJobsSignalConfig as any);
      signalRegistry.register('clusterRole', buildClusterRolesSignalConfig as any);
      signalRegistry.register('role', buildRolesSignalConfig as any);
      signalRegistry.register('serviceAccount', buildServiceAccountsSignalConfig as any);

      // Side-panel preview component is still wired through the legacy
      // UI-config service — it's used by the resource-viewer drawer
      // independent of the list path.
      uiConfigService.previewComponent.set(kubernetesNamespacesEntityType, KubernetesNamespacePreviewComponent);
    }
  }
}
