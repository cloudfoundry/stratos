/* tslint:disable:max-line-length */
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import {
  KubedashConfigurationComponent,
} from './kubernetes-dashboard/kubedash-configuration/kubedash-configuration.component';
import { KubernetesDashboardTabComponent } from './kubernetes-dashboard/kubernetes-dashboard.component';
import {
  KubernetesNamespacePodsComponent,
} from './kubernetes-namespace/kubernetes-namespace-pods/kubernetes-namespace-pods.component';
import {
  KubernetesNamespaceServicesComponent,
} from './kubernetes-namespace/kubernetes-namespace-services/kubernetes-namespace-services.component';
import { KubernetesNamespaceComponent } from './kubernetes-namespace/kubernetes-namespace.component';
import {
  KubernetesNodeMetricStatsCardComponent,
} from './kubernetes-node/kubernetes-node-metrics/kubernetes-node-metric-stats-card/kubernetes-node-metric-stats-card.component';
import {
  KubernetesNodeMetricsChartComponent,
} from './kubernetes-node/kubernetes-node-metrics/kubernetes-node-metrics-chart/kubernetes-node-metrics-chart.component';
import { KubernetesNodeMetricsComponent } from './kubernetes-node/kubernetes-node-metrics/kubernetes-node-metrics.component';
import {
  KubernetesNodeSimpleMetricComponent,
} from './kubernetes-node/kubernetes-node-metrics/kubernetes-node-simple-metric/kubernetes-node-simple-metric.component';
import { KubernetesNodePodsComponent } from './kubernetes-node/kubernetes-node-pods/kubernetes-node-pods.component';
import { KubernetesNodeComponent } from './kubernetes-node/kubernetes-node.component';
import { BaseKubeGuid } from './kubernetes-page.types';
import { KubernetesResourceViewerComponent } from './kubernetes-resource-viewer/kubernetes-resource-viewer.component';
import { KubernetesTabBaseComponent } from './kubernetes-tab-base/kubernetes-tab-base.component';
import { KubernetesRoutingModule } from './kubernetes.routing';
import { KubernetesComponent } from './kubernetes/kubernetes.component';
import { KubernetesLabelsCellComponent } from './list-types/kubernetes-labels-cell/kubernetes-labels-cell.component';
import {
  KubeNamespacePodCountComponent,
} from './list-types/kubernetes-namespaces/kube-namespace-pod-count/kube-namespace-pod-count.component';
import {
  KubernetesNamespaceLinkComponent,
} from './list-types/kubernetes-namespaces/kubernetes-namespace-link/kubernetes-namespace-link.component';
import { ConditionCellComponent } from './list-types/kubernetes-nodes/condition-cell/condition-cell.component';
import {
  KubernetesNodeCapacityComponent,
} from './list-types/kubernetes-nodes/kubernetes-node-capacity/kubernetes-node-capacity.component';
import { KubernetesNodeIpsComponent } from './list-types/kubernetes-nodes/kubernetes-node-ips/kubernetes-node-ips.component';
import {
  KubernetesNodeLabelsComponent,
} from './list-types/kubernetes-nodes/kubernetes-node-labels/kubernetes-node-labels.component';
import {
  KubernetesNodeLinkComponent,
} from './list-types/kubernetes-nodes/kubernetes-node-link/kubernetes-node-link.component';
import {
  KubernetesNodePressureComponent,
} from './list-types/kubernetes-nodes/kubernetes-node-pressure/kubernetes-node-pressure.component';
import {
  KubernetesNodeConditionCardComponent,
} from './list-types/kubernetes-nodes/kubernetes-node-summary/kubernetes-node-condition-card/kubernetes-node-condition-card.component';
import {
  KubernetesNodeConditionComponent,
} from './list-types/kubernetes-nodes/kubernetes-node-summary/kubernetes-node-condition-card/kubernetes-node-condition/kubernetes-node-condition.component';
import {
  KubernetesNodeInfoCardComponent,
} from './list-types/kubernetes-nodes/kubernetes-node-summary/kubernetes-node-info-card/kubernetes-node-info-card.component';
import {
  KubernetesNodeSummaryCardComponent,
} from './list-types/kubernetes-nodes/kubernetes-node-summary/kubernetes-node-summary-card/kubernetes-node-summary-card.component';
import {
  KubernetesNodeSummaryComponent,
} from './list-types/kubernetes-nodes/kubernetes-node-summary/kubernetes-node-summary.component';
import {
  KubernetesNodeTagsCardComponent,
} from './list-types/kubernetes-nodes/kubernetes-node-summary/kubernetes-node-tags-card/kubernetes-node-tags-card.component';
import { NodePodCountComponent } from './list-types/kubernetes-nodes/node-pod-count/node-pod-count.component';
import {
  KubernetesPodContainersComponent,
} from './list-types/kubernetes-pods/kubernetes-pod-containers/kubernetes-pod-containers.component';
import {
  KubernetesPodStatusComponent,
} from './list-types/kubernetes-pods/kubernetes-pod-status/kubernetes-pod-status.component';
import { KubernetesPodTagsComponent } from './list-types/kubernetes-pods/kubernetes-pod-tags/kubernetes-pod-tags.component';
import { KubernetesServicePortsComponent } from './list-types/kubernetes-service-ports/kubernetes-service-ports.component';
import {
  KubeServiceCardComponent,
} from './list-types/kubernetes-services/kubernetes-service-card/kubernetes-service-card.component';
import { PodMetricsComponent } from './pod-metrics/pod-metrics.component';
import { KubernetesEndpointService } from './services/kubernetes-endpoint.service';
import { KubernetesNodeService } from './services/kubernetes-node.service';
import { KubernetesService } from './services/kubernetes.service';
import { KubernetesNamespacesTabComponent } from './tabs/kubernetes-namespaces-tab/kubernetes-namespaces-tab.component';
import { KubernetesNodesTabComponent } from './tabs/kubernetes-nodes-tab/kubernetes-nodes-tab.component';
import { KubernetesPodsTabComponent } from './tabs/kubernetes-pods-tab/kubernetes-pods-tab.component';
import { KubernetesSummaryTabComponent } from './tabs/kubernetes-summary-tab/kubernetes-summary.component';


/* tslint:enable */

@NgModule({
  imports: [
    CoreModule,
    CommonModule,
    SharedModule,
    NgxChartsModule,
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
    KubernetesDashboardTabComponent,
    KubernetesSummaryTabComponent,
    PodMetricsComponent,
    KubernetesNodeLinkComponent,
    KubernetesNodeIpsComponent,
    KubernetesNodeLabelsComponent,
    KubernetesNodePressureComponent,
    KubernetesLabelsCellComponent,
    KubernetesNodeComponent,
    KubernetesNodeSummaryComponent,
    KubernetesNodePodsComponent,
    KubernetesNodeSummaryCardComponent,
    KubernetesNodeConditionCardComponent,
    KubernetesNodeTagsCardComponent,
    KubernetesNodePodsComponent,
    KubernetesNodeInfoCardComponent,
    KubernetesNodeMetricsComponent,
    KubernetesNodeConditionComponent,
    KubernetesNodeMetricsChartComponent,
    KubernetesNodeMetricStatsCardComponent,
    KubernetesNodeSimpleMetricComponent,
    ConditionCellComponent,
    KubernetesNamespaceLinkComponent,
    KubernetesNamespaceComponent,
    KubernetesNamespacePodsComponent,
    KubernetesNamespaceServicesComponent,
    KubeNamespacePodCountComponent,
    NodePodCountComponent,
    KubernetesServicePortsComponent,
    KubernetesPodStatusComponent,
    KubeServiceCardComponent,
    KubernetesResourceViewerComponent,
    KubeServiceCardComponent,
    KubedashConfigurationComponent,
    KubernetesPodContainersComponent
  ],
  providers: [
    KubernetesService,
    BaseKubeGuid,
    KubernetesEndpointService,
    KubernetesNodeService
  ],
  entryComponents: [
    KubernetesNodeCapacityComponent,
    KubernetesPodTagsComponent,
    KubernetesNodeLinkComponent,
    KubernetesNodeIpsComponent,
    KubernetesNodeLabelsComponent,
    KubernetesNodePressureComponent,
    KubernetesLabelsCellComponent,
    ConditionCellComponent,
    KubernetesNamespaceLinkComponent,
    KubeNamespacePodCountComponent,
    NodePodCountComponent,
    KubernetesServicePortsComponent,
    KubernetesPodStatusComponent,
    KubeServiceCardComponent,
    KubernetesResourceViewerComponent,
    KubernetesPodContainersComponent
  ],
  exports: [
    KubernetesResourceViewerComponent
  ]
})
export class KubernetesModule { }

