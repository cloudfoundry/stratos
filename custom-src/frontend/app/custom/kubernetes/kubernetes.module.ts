import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { HelmReleaseBaseComponent } from './helm-release/helm-release-base/helm-release-base.component';
import {
  HelmReleasePodsComponent,
} from './helm-release/helm-release-tabs-base/helm-release-pods/helm-release-pods.component';
import {
  HelmReleaseServicesComponent,
} from './helm-release/helm-release-tabs-base/helm-release-services/helm-release-services.component';
import {
  HelmReleaseSummaryCardComponent,
} from './helm-release/helm-release-tabs-base/helm-release-summary/helm-release-summary-card/helm-release-summary-card.component';
import {
  HelmReleaseSummaryComponent,
} from './helm-release/helm-release-tabs-base/helm-release-summary/helm-release-summary.component';
import { HelmReleaseTabsBaseComponent } from './helm-release/helm-release-tabs-base/helm-release-tabs-base.component';
import { HelmReleaseComponent } from './helm-release/helm-release.component';
import { BaseKubeGuid } from './kubernetes-page.types';
import { KubernetesTabBaseComponent } from './kubernetes-tab-base/kubernetes-tab-base.component';
import { KubernetesRoutingModule } from './kubernetes.routing';
import { KubernetesComponent } from './kubernetes/kubernetes.component';
import { AppLinkComponent } from './list-types/kubernetes-apps/app-link/app-link.component';
import {
  KubernetesNodeCapacityComponent,
} from './list-types/kubernetes-nodes/kubernetes-node-capacity/kubernetes-node-capacity.component';
import { KubernetesPodTagsComponent } from './list-types/kubernetes-pods/kubernetes-pod-tags/kubernetes-pod-tags.component';
import { KubernetesEndpointService } from './services/kubernetes-endpoint.service';
import { KubernetesService } from './services/kubernetes.service';
import { KubernetesAppsTabComponent } from './tabs/kubernetes-apps-tab/kubernetes-apps-tab.component';
import { KubernetesNamespacesTabComponent } from './tabs/kubernetes-namespaces-tab/kubernetes-namespaces-tab.component';
import { KubernetesNodesTabComponent } from './tabs/kubernetes-nodes-tab/kubernetes-nodes-tab.component';
import { KubernetesPodsTabComponent } from './tabs/kubernetes-pods-tab/kubernetes-pods-tab.component';
import { HelmReleaseService } from './services/helm-release.service';

@NgModule({
  imports: [
    CoreModule,
    CommonModule,
    SharedModule,
    KubernetesRoutingModule,
  ],
  declarations: [
    KubernetesComponent,
    KubernetesNodesTabComponent,
    KubernetesTabBaseComponent,
    KubernetesNodeCapacityComponent,
    KubernetesPodsTabComponent,
    KubernetesPodTagsComponent,
    KubernetesNamespacesTabComponent,
    KubernetesAppsTabComponent,
    HelmReleaseComponent,
    AppLinkComponent,
    HelmReleaseBaseComponent,
    HelmReleaseTabsBaseComponent,
    HelmReleasePodsComponent,
    HelmReleaseSummaryComponent,
    HelmReleaseServicesComponent,
    HelmReleaseSummaryCardComponent
  ],
  providers: [
    KubernetesService,
    BaseKubeGuid,
    KubernetesEndpointService,
    HelmReleaseService
  ],
  entryComponents: [
    KubernetesNodeCapacityComponent,
    KubernetesPodTagsComponent,
    AppLinkComponent
  ]
})
export class KubernetesModule {

}

