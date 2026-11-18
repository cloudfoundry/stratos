import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SafeResourceUrl } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
import { interval, Subscription } from 'rxjs';

import { safeUnsubscribe } from '../../../../../core/src/core/utils.service';
import {
  IChartThresholds,
} from '../../../../../core/src/shared/components/simple-usage-chart/simple-usage-chart.types';
import { SimpleUsageChartComponent } from '../../../../../core/src/shared/components/simple-usage-chart/simple-usage-chart.component';
import { PageSubNavComponent } from '../../../../../core/src/shared/components/page-sub-nav/page-sub-nav.component';
import { LoadingPageComponent } from '../../../../../core/src/shared/components/loading-page/loading-page.component';
import {
  CardNumberMetricComponent,
  EntitySummaryTitleComponent,
  MetadataItemComponent,
  TileComponent,
  TileGridComponent,
  TileGroupComponent,
} from '@stratosui/core';
import { entityCatalog } from '@stratosui/store';
import { KubePodDataService } from '../../../services/domain-data/kube-pod-data.service';
import { KubeNodeDataService } from '../../../services/domain-data/kube-node-data.service';
import { KubeNamespaceDataService } from '../../../services/domain-data/kube-namespace-data.service';
import { KubeClusterLoadFailures } from '../../../services/domain-data/kube-cluster-load-failures';
import { KubernetesNode, KubernetesPod } from '../../store/kube.types';
import {
  KubernetesEndpointService,
  kubeDashboardConfigured,
  kubeDashboardLabel,
} from '../../services/kubernetes-endpoint.service';

const cssVar = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

interface IEndpointDetails {
  // imagePath/label derive from the endpoint definition's optional
  // logoUrl/label fields, so both may legitimately be absent.
  imagePath?: string;
  label?: string;
  name: string;
}

@Component({
  selector: 'app-kubernetes-summary',
  templateUrl: './kubernetes-summary.component.html',
  styleUrls: ['./kubernetes-summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    RouterModule,
    SimpleUsageChartComponent,
    PageSubNavComponent,
    LoadingPageComponent,
    EntitySummaryTitleComponent,
    TileGridComponent,
    TileGroupComponent,
    TileComponent,
    CardNumberMetricComponent,
    MetadataItemComponent
  ]
})
export class KubernetesSummaryTabComponent implements OnInit, OnDestroy {
  // Resolve adaptive theme colors once at construction. These feed
  // SimpleUsageChart domains; the component is not rebuilt on a live theme
  // toggle, so the colors reflect the theme active when this view loaded.
  private successColor = cssVar('--color-success');
  private successTint = `color-mix(in srgb, ${this.successColor} 18%, transparent)`;
  private neutralTrack = `color-mix(in srgb, ${cssVar('--content-text')} 15%, transparent)`;

  public highUsageColors = {
    domain: [this.neutralTrack, this.successColor]
  };
  public normalUsageColors = {
    domain: [this.successColor, this.successTint]
  };
  public chartHeight = '150px';

  public kubeEndpointService = inject(KubernetesEndpointService);
  public httpClient = inject(HttpClient);
  private podData = inject(KubePodDataService);
  private nodeData = inject(KubeNodeDataService);
  private namespaceData = inject(KubeNamespaceDataService);
  private failures = inject(KubeClusterLoadFailures);
  private router = inject(Router);

  readonly endpointDetails = computed((): IEndpointDetails | null => {
    const endpoint = this.kubeEndpointService.endpoint();
    if (!endpoint) {
      return null;
    }
    // strict: this view only renders for a connected kubernetes endpoint,
    // so its model always carries a cnsi_type
    const endpointConfig = entityCatalog.getEndpoint(endpoint.cnsi_type!, endpoint.sub_type);
    const { logoUrl, label } = endpointConfig?.definition ?? {};
    return {
      imagePath: logoUrl,
      label,
      name: endpoint.name,
    };
  });
  source?: SafeResourceUrl;

  // strict: assigned in ngOnInit before the template reads them
  dashboardLink!: string;
  kubeTerminalLink!: string;

  // The dashboard status is an HTTP read; the page subscribes to it here.
  readonly dashboardStatus = toSignal(this.kubeEndpointService.kubeDashboardStatus$, { initialValue: null });
  readonly dashboardConfigured = computed(() => kubeDashboardConfigured(this.dashboardStatus()));
  readonly dashboardLabel = computed(() => kubeDashboardLabel(this.dashboardStatus()));

  // Cluster lists from the signal-native data services. The pod/node helpers
  // are typed against the legacy KubernetesPod/KubernetesNode shapes; the
  // runtime k8s JSON is identical, so cast at this boundary.
  private readonly podList = this.podData.podsInCluster(this.kubeEndpointService.baseKube.guid);
  private readonly nodeList = this.nodeData.nodesInCluster(this.kubeEndpointService.baseKube.guid);
  private readonly namespaces = this.namespaceData.namespacesForEndpoint(this.kubeEndpointService.baseKube.guid);
  private readonly pods = computed(() => this.podList() as unknown as KubernetesPod[]);
  private readonly nodes = computed(() => this.nodeList() as unknown as KubernetesNode[]);

  // A count whose load failed is null: the tile shows "-", not 0.
  readonly podCount = computed(() => this.failures.pods(this.guid()) ? null : this.pods().length);
  readonly nodeCount = computed(() => this.failures.nodes(this.guid()) ? null : this.nodes().length);
  readonly namespaceCount = computed(() => this.failures.namespaces(this.guid()) ? null : this.namespaces().length);

  readonly podCapacity = computed(() => this.kubeEndpointService.getPodCapacity(this.nodes(), this.pods()));
  readonly diskPressure = computed(() => this.kubeEndpointService.getNodeStatusCount(this.nodes(), 'DiskPressure', {
    usedLabel: 'Nodes with disk pressure',
    remainingLabel: 'Nodes with no disk pressure',
    unknownLabel: 'Nodes with unknown disk pressure',
    warningText: 'Nodes with unknown disk pressure found'
  }));
  readonly memoryPressure = computed(() => this.kubeEndpointService.getNodeStatusCount(this.nodes(), 'MemoryPressure', {
    usedLabel: 'Nodes with memory pressure',
    remainingLabel: 'Nodes with no memory pressure',
    unknownLabel: 'Nodes with unknown memory pressure',
    warningText: 'Nodes with unknown memory pressure found'
  }));
  readonly outOfDisk = computed(() => this.kubeEndpointService.getNodeStatusCount(this.nodes(), 'OutOfDisk', {
    usedLabel: 'Nodes that are out of disk space',
    remainingLabel: 'Nodes that have disk space remaining',
    unknownLabel: 'Nodes with unknown remaining disk space',
    warningText: 'Nodes with unknown remaining disk space found'
  }));
  // getNodeStatusCount decorates the chart data with a `supported` flag —
  // NetworkUnavailable is only reported by some K8S versions.
  readonly networkUnavailable = computed(() => this.kubeEndpointService.getNodeStatusCount(this.nodes(), 'NetworkUnavailable', {
    usedLabel: 'Nodes with available networks',
    remainingLabel: 'Nodes with unavailable networks',
    unknownLabel: 'Nodes with unknown networks availability',
    warningText: 'Nodes with unknown networks availability found'
  }, 'False'));
  readonly nodesReady = computed(() => this.kubeEndpointService.getNodeStatusCount(this.nodes(), 'Ready', {
    usedLabel: 'Nodes are ready',
    remainingLabel: 'Nodes are not ready',
    unknownLabel: 'Nodes with unknown ready status',
    warningText: `Nodes with unknown ready status found`
  }));
  readonly kubeNodeVersions = computed(() => this.kubeEndpointService.getNodeKubeVersions(this.nodes()) || '-');
  readonly caaspData = computed(() => this.kubeEndpointService.getCaaspNodesData(this.nodes()));

  public pressureChartThresholds: IChartThresholds = {
    danger: 90,
    warning: 0,
  };

  public nominalPressureChartThresholds: IChartThresholds = {
    warning: 100,
    inverted: true
  };

  public criticalPressureChartThresholds: IChartThresholds = {
    danger: 0
  };

  public criticalPressureChartThresholdsInverted: IChartThresholds = {
    danger: 100,
    inverted: true
  };

  private polls: Subscription[] = [];

  // The charts and counts are computed straight from the cluster lists,
  // so the page waits only for the endpoint.
  readonly isLoading = computed(() => !this.endpointDetails());

  // Why a cluster list failed to load (shown above the charts), and
  // whether the node list did (its charts are then hidden: they would
  // chart an empty list). A failed count shows "-", not 0.
  private readonly guid = computed(() => this.kubeEndpointService.baseKube.guid);
  readonly failureReason = computed(() => this.failures.any(this.guid()));
  readonly nodesFailed = computed(() => !!this.failures.nodes(this.guid()));
  readonly podsFailed = computed(() => !!this.failures.pods(this.guid()));

  // Go the Kubernetes Dashboard configuration page
  public configureDashboard() {
    const guid = this.kubeEndpointService.baseKube.guid;
    this.router.navigate([`/kubernetes/${guid}/dashboard-config`]);
  }
  ngOnInit() {
    const guid = this.kubeEndpointService.baseKube.guid;

    // Prime the caches now, then poll them on the same 10s cadence the old
    // pagination dispatch poll drove.
    this.refreshAll(guid);
    this.poll(guid);

    this.dashboardLink = `/kubernetes/${guid}/dashboard`;
    this.kubeTerminalLink = `/kubernetes/${guid}/terminal`;
  }

  private poll(guid: string) {
    this.polls.push(interval(10000).subscribe(() => this.refreshAll(guid)));
  }

  // Refresh the three cluster caches. Each refresh sends its own request
  // (none is deduplicated against one already in flight).
  private refreshAll(guid: string) {
    void this.podData.refresh({ kubeGuid: guid });
    void this.nodeData.refresh(guid);
    void this.namespaceData.refresh({ kubeGuid: guid });
  }

  ngOnDestroy() {
    safeUnsubscribe(...(this.polls || []));
  }

}
