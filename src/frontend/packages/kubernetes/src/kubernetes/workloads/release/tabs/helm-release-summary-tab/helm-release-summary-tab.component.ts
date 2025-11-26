import { CommonModule, AsyncPipe, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {Component, ComponentFactoryResolver, type OnDestroy, signal, computed, inject, ChangeDetectionStrategy, Injector, runInInjectionContext } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ConfirmationDialogConfig, ConfirmationDialogService, SidePanelService } from '@stratosui/core';
import { ClearPaginationOfType } from '@stratosui/store';
import { RouterNav } from '@stratosui/store';
import type { AppState } from '@stratosui/store';
import type { Observable } from 'rxjs';
import { distinctUntilChanged, filter, first, map, } from 'rxjs/operators';

import {
  PageSubNavComponent,
  LoadingPageComponent,
  EntitySummaryTitleComponent,
  MetadataItemComponent,
  TileGridComponent,
  TileGroupComponent,
  TileComponent,
  RingChartComponent,
  CardNumberMetricComponent
} from '@stratosui/core';
import { AnalysisReportRunnerComponent } from '../../../../analysis-report-viewer/analysis-report-runner/analysis-report-runner.component';
import { AnalysisReportSelectorComponent } from '../../../../analysis-report-viewer/analysis-report-selector/analysis-report-selector.component';
import { WorkloadLiveReloadComponent } from '../../workload-live-reload/workload-live-reload.component';

import { SnackBarService } from '@stratosui/core';
import { endpointsEntityRequestDataSelector } from '@stratosui/store';
import {
  ResourceAlertPreviewComponent,
} from '../../../../analysis-report-viewer/resource-alert-preview/resource-alert-preview.component';
import { KubernetesAnalysisService } from '../../../../services/kubernetes.analysis.service';
import type { AnalysisReport } from '../../../../store/kube.types';
import type { HelmReleaseChartData, HelmReleaseGraphNode } from '../../../workload.types';
import { workloadsEntityCatalog } from '../../../workloads-entity-catalog';
import { getIcon } from '../../icon-helper';
import { HelmReleaseHelperService, type InternalHelmUpgrade } from '../helm-release-helper.service';
import type { ResourceAlert } from './../../../../services/analysis-report.types';

interface ReleaseResource {
  kind: string;
  label: string;
  count: number;
  statuses: string[];
  icon: string;
  alerts: ResourceAlert[];
}

@Component({
  selector: 'app-helm-release-summary-tab',
  templateUrl: './helm-release-summary-tab.component.html',
  styleUrls: ['./helm-release-summary-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    DatePipe,
    RouterModule,
    PageSubNavComponent,
    LoadingPageComponent,
    EntitySummaryTitleComponent,
    MetadataItemComponent,
    TileGridComponent,
    TileGroupComponent,
    TileComponent,
    RingChartComponent,
    CardNumberMetricComponent,
    AnalysisReportRunnerComponent,
    AnalysisReportSelectorComponent,
    WorkloadLiveReloadComponent
  ]
})
export class HelmReleaseSummaryTabComponent implements OnDestroy {
  // Confirmation dialogs
  deleteReleaseConfirmation: ConfirmationDialogConfig;

  private busyDeleting = signal<boolean>(false);
  public isBusy$: Observable<boolean>;
  public hasResources$: Observable<boolean>;
  public hasAllResources$: Observable<boolean>;
  private readonly DEFAULT_LOADING_MESSAGE = 'Retrieving Release Details';
  public loadingMessage = this.DEFAULT_LOADING_MESSAGE;

  public podsChartData: { name: string; value: number }[] = [];
  public containersChartData: { name: string; value: number }[] = [];

  private successChartColor = '#4DD3A7';
  private completedChartColour = '#7aa3e5';

  public path: string;

  public hasUpgrade$: Observable<string>;

  // Can we upgrade? Yes as long as the Helm Chart can be found
  public canUpgrade$: Observable<boolean>;

  public podChartColors = [
    {
      name: 'Running',
      value: this.successChartColor
    },
    {
      name: 'Completed',
      value: this.completedChartColour
    },
  ];

  public containersChartColors = [
    {
      name: 'Ready',
      value: this.successChartColor
    },
    {
      name: 'Not Ready',
      value: '#E7727D'
    }
  ];

  // Blue: #00B2E2
  // Yellow: #FFC107

  private deleted = false;
  public chartData$: Observable<HelmReleaseChartData>;
  public resources$: Observable<ReleaseResource[]>;

  // Cached analysis report
  private analysisReport: AnalysisReport | null = null;

  private analysisReportId = signal<string | null>(null);
  private componentFactoryResolver = inject(ComponentFactoryResolver);
  public helmReleaseHelper = inject(HelmReleaseHelperService);
  private store = inject(Store<AppState>);
  private confirmDialog = inject(ConfirmationDialogService);
  private httpClient = inject(HttpClient);
  private snackbarService = inject(SnackBarService);
  public analyzerService = inject(KubernetesAnalysisService);
  private previewPanel = inject(SidePanelService);
  private injector = inject(Injector);



  constructor() {
    // Convert signals within injection context
    runInInjectionContext(this.injector, () => {
      // Convert isFetching$ to signal for computed
      const isFetchingSignal = toSignal(
        this.helmReleaseHelper.isFetching$,
        { initialValue: true }
      );

      // Use computed for isBusy
      const isBusyComputed = computed(() =>
        isFetchingSignal() || this.busyDeleting()
      );

      // Provide as Observable for backward compatibility with template
      this.isBusy$ = toObservable(isBusyComputed);

      this.path = `${this.helmReleaseHelper.namespace}/${this.helmReleaseHelper.releaseTitle}`;

      this.chartData$ = this.helmReleaseHelper.fetchReleaseChartStats().pipe(
        distinctUntilChanged(),
        map((chartData: HelmReleaseChartData) => ({
          ...chartData,
          containersChartData: chartData.containersChartData.sort((a, b) => a.name.localeCompare(b.name)),
          podsChartData: chartData.podsChartData.sort((a, b) => a.name.localeCompare(b.name))
        })
        )
      );

      this.hasUpgrade$ = this.helmReleaseHelper.hasUpgrade().pipe(map((v: InternalHelmUpgrade | null) => v ? v.version : null));

      // Can upgrade if the Chart is available
      this.canUpgrade$ = this.helmReleaseHelper.hasUpgrade(true).pipe(map((v: InternalHelmUpgrade | null) => !!v));

      // Convert release graph to signal
      const releaseGraphSignal = toSignal(
        this.helmReleaseHelper.fetchReleaseGraph(),
        { initialValue: { nodes: {}, links: {}, endpointId: '', releaseTitle: '' } }
      );

      // Compute resources based on graph and analysis report
      const resourcesComputed = computed(() => {
        const graph = releaseGraphSignal();
        const _ = this.analysisReportId(); // Dependency on analysis report changes

        const resources: Record<string, ReleaseResource> = {};
        // Collect the resources
        if (graph?.nodes) {
          Object.values(graph.nodes).forEach((node: HelmReleaseGraphNode) => {
            if (!resources[node.data.kind]) {
              resources[node.data.kind] = {
                kind: node.data.kind,
                label: `${node.data.kind}s`,
                count: 0,
                statuses: [],
                icon: getIcon(node.data.kind).name,
                alerts: []
              };
            }
            resources[node.data.kind].count++;
            resources[node.data.kind].statuses.push(node.data.status);
          });
        }
        this.applyAnalysis(resources, this.analysisReport);
        return Object.values(resources).sort((a, b) => a.kind.localeCompare(b.kind));
      });

      this.resources$ = toObservable(resourcesComputed);


      // Convert chart data to signal
      const chartDataSignal = toSignal(
        this.chartData$,
        { initialValue: null as HelmReleaseChartData | null }
      );

      // Compute hasResources
      const hasResourcesComputed = computed(() => {
        const chartData = chartDataSignal();
        const resources = resourcesComputed();
        return !!chartData && !!resources;
      });

      this.hasResources$ = toObservable(hasResourcesComputed);

      // Compute hasAllResources
      const hasAllResourcesComputed = computed(() => {
        const resources = resourcesComputed();
        const hasSome = hasResourcesComputed();
        return hasSome && resources && resources.length > 0;
      });

      this.hasAllResources$ = toObservable(hasAllResourcesComputed);
    });

    this.deleteReleaseConfirmation = new ConfirmationDialogConfig(
      `Delete Workload`,
      {
        textToMatch: this.helmReleaseHelper.releaseTitle
      },
      'Delete'
    );


  }

  public analysisChanged(report: { id: string } | null) {
    if (report === null) {
      // No report selected
      this.analysisReport = null;
      this.analysisReportId.set(null);
    } else {
      this.analyzerService.getByID(this.helmReleaseHelper.endpointGuid, report.id).subscribe((results: AnalysisReport) => {
        this.analysisReport = results;
        this.analysisReportId.set(report.id);
      });
    }
  }

  private startDelete() {
    this.loadingMessage = 'Deleting Release';
    this.busyDeleting.set(true);
  }

  private endDelete() {
    this.loadingMessage = this.DEFAULT_LOADING_MESSAGE;
    this.busyDeleting.set(false);
  }

  private completeDelete() {
    this.deleted = true;
    this.endDelete();
  }


  public deleteRelease() {
    this.confirmDialog.open(this.deleteReleaseConfirmation, () => {
      // Make the http request to delete the release
      const endpointAndName = this.helmReleaseHelper.guid.replace(':', '/').replace(':', '/');
      this.startDelete();
      this.httpClient.delete(`/pp/v1/helm/releases/${endpointAndName}`).subscribe({
        error: (err: unknown) => {
          this.endDelete();
          this.snackbarService.show('Failed to delete release', 'Close');
          console.error('Failed to delete release: ', err);
        },
        complete: () => {
          const action = workloadsEntityCatalog.release.actions.getMultiple();
          this.store.dispatch(new ClearPaginationOfType(action));
          this.completeDelete();
          this.store.dispatch(new RouterNav({ path: ['./workloads'] }));
        }
      });
    });
  }

  ngOnDestroy() {
    if (this.deleted) {
      this.snackbarService.hide();
    }
  }

  public createNamespaceLink(namespace: string): string[] {
    return [
      `/kubernetes`,
      this.helmReleaseHelper.endpointGuid,
      `namespaces`,
      namespace
    ];
  }

  public createClusterLink(): string[] {
    return [
      `/kubernetes`,
      this.helmReleaseHelper.endpointGuid,
    ];
  }

  public getClusterName(): Observable<string> {
    return this.store.select(endpointsEntityRequestDataSelector(this.helmReleaseHelper.endpointGuid)).pipe(
      filter((e: { name: string } | undefined) => !!e),
      map((e: { name: string }) => e.name),
      first()
    );
  }

  private applyAnalysis(resources: Record<string, ReleaseResource>, report: AnalysisReport | null) {
    // Clear out existing alerts for all resources
    for (const resource of Object.values(resources)) {
      resource.alerts = [];
    }

    if (report && Object.keys(resources).length > 0) {
      Object.values(report.alerts).forEach((group: ResourceAlert[]) => {
        group.forEach(alert => {
          // Can we find a corresponding group in the resources?
          const res = Object.keys(resources).find((i) => i.toLowerCase() === alert.kind);
          if (res) {
            const resItem = resources[res];
            if (resItem) {
              resItem.alerts.push(alert);
            }
          }
        });
      });
    }
  }

  public showAlerts(alerts: ResourceAlert[], resource: { kind: string; label: string; count: number; statuses: string[]; icon: string; alerts: ResourceAlert[] }) {
    this.previewPanel.show(
      ResourceAlertPreviewComponent,
      {
        resource,
        alerts,
      },
      this.componentFactoryResolver
    );
  }
}
