import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, WritableSignal, inject, signal } from '@angular/core';

import { PageSubNavComponent, SignalListComponent, SignalListConfig } from '@stratosui/core';
import { formatDistance } from 'date-fns';

import { AnalysisReport } from '../../../services/endpoint-data/kube-types';
import {
  AnalysisReportsSignalConfigService,
} from '../../list-types/analysis-reports/analysis-reports-signal-config.service';
import { AnalysisReportRunnerComponent } from '../../analysis-report-viewer/analysis-report-runner/analysis-report-runner.component';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { KubernetesAnalysisService } from '../../services/kubernetes.analysis.service';

// Signal-native analysis-reports tab. Replaces the legacy
// `AnalysisReportsListConfig` + `AnalysisReportsDataSource` pair with
// `AnalysisReportsSignalConfigService`. Data path:
//   <app-signal-list> ← SignalListConfig ← signal-config ← KubeAnalysisDataService
//
// `KubernetesAnalysisService` is still provided here so the embedded
// runner (`<app-analysis-report-runner>`) can call its `run()` API; the
// runner itself is wave-2 K-shared territory and still drives ngrx.
// Once the runner migrates the provider line goes away.
@Component({
  selector: 'app-kubernetes-analysis-tab',
  templateUrl: './kubernetes-analysis-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    PageSubNavComponent,
    AnalysisReportRunnerComponent,
    SignalListComponent,
  ],
  providers: [
    KubernetesAnalysisService,
  ],
})
export class KubernetesAnalysisTabComponent {
  public kubeEndpointService = inject(KubernetesEndpointService);
  readonly signalConfig = inject(AnalysisReportsSignalConfigService);

  readonly listConfig: WritableSignal<SignalListConfig<AnalysisReport> | undefined> = signal(undefined);

  constructor() {
    const kubeGuid = this.kubeEndpointService.kubeGuid;
    this.signalConfig.initialize(kubeGuid);
    void this.signalConfig.loadAll();

    this.listConfig.set({
      pagedItems: this.signalConfig.view.pagedItems,
      totalFilteredResults: this.signalConfig.view.totalFilteredResults,
      totalPages: this.signalConfig.view.totalPages,
      pageIndex: this.signalConfig.pageIndex,
      pageSize: this.signalConfig.pageSize,
      isAnyLoading: this.signalConfig.isLoading(),
      errorsByCnsi: signal(new Map()),
      columns: [
        {
          header: 'Name', key: 'name',
          sortField: (r: AnalysisReport) => (r.name ?? '').toLowerCase(),
          // Only completed reports are linkable — pending/failed reports
          // have no detail body to show. Mirrors legacy `getLink`
          // gating in `AnalysisReportsListConfig`.
          kind: 'link',
          link: (r: AnalysisReport) => r.status === 'completed'
            ? ['/kubernetes', kubeGuid, 'analysis', 'report', r.id]
            : null,
          render: (r: AnalysisReport) => r.name,
          widthHint: '24rem',
        },
        {
          header: 'Type', key: 'type',
          sortField: (r: AnalysisReport) => (r.type ?? '').toLowerCase(),
          kind: 'text',
          render: (r: AnalysisReport) => r.type
            ? r.type.charAt(0).toUpperCase() + r.type.slice(1)
            : '',
          widthHint: '10rem',
        },
        {
          header: 'Age', key: 'created',
          sortField: (r: AnalysisReport) => {
            const c = r.created as unknown;
            if (c instanceof Date) return c.getTime();
            if (typeof c === 'number') return c;
            if (typeof c === 'string') {
              const t = Date.parse(c);
              return Number.isNaN(t) ? 0 : t;
            }
            return 0;
          },
          kind: 'text',
          render: (r: AnalysisReport) => {
            if (!r.created) return '';
            const d = r.created instanceof Date ? r.created : new Date(r.created);
            if (Number.isNaN(d.getTime())) return '';
            return formatDistance(d, new Date());
          },
          widthHint: '10rem',
        },
        {
          header: 'Status', key: 'status',
          sortField: (r: AnalysisReport) => (r.status ?? '').toLowerCase(),
          kind: 'text',
          render: (r: AnalysisReport) => r.status
            ? r.status.charAt(0).toUpperCase() + r.status.slice(1)
            : '',
          widthHint: '8rem',
        },
      ],
      getRowKey: (r: AnalysisReport) => r.id,
      emptyMessage: 'There are no Analysis Reports',
      emptyFilterMessage: 'No Analysis Reports match the current filter',
      loadingMessage: 'Loading Analysis Reports…',
      pageSizeOptions: { table: [10, 25, 50, 100], card: [6, 12, 24, 48, 96] },
      nameFilter: this.signalConfig.nameFilter,
      onRefresh: () => this.signalConfig.refresh(),
      onClear: () => this.signalConfig.clearFilters(),
      viewMode: this.signalConfig.viewMode,
      sort: this.signalConfig.sort,
    });
  }
}
