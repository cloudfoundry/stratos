import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, WritableSignal, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';

import { ApplicationService } from '../../../../cloud-foundry/src/features/applications/application.service';
import { CustomIconComponent, SignalListComponent, SignalListConfig } from '@stratosui/core';
import { PageHeaderComponent } from '../../../../core/src/shared/components/page-header/page-header.component';
import {
  AppAutoscalerMetricChartCardComponent,
} from '../../shared/list-types/app-autoscaler-metric-chart/app-autoscaler-metric-chart-card/app-autoscaler-metric-chart-card.component';
import {
  AppAutoscalerMetricChartSignalConfigService,
  AutoscalerMetricChartRow,
} from '../../shared/list-types/app-autoscaler-metric-chart/app-autoscaler-metric-chart-signal-config.service';
import { AutoscalerConstants } from '../../core/autoscaler-helpers/autoscaler-util';

@Component({
  selector: 'app-autoscaler-metric-page',
  templateUrl: './autoscaler-metric-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CustomIconComponent,
    PageHeaderComponent,
    SignalListComponent,
    AppAutoscalerMetricChartCardComponent,
  ],
})
export class AutoscalerMetricPageComponent implements OnInit {
  applicationService = inject(ApplicationService);
  private cdr = inject(ChangeDetectorRef);
  private chartConfig = inject(AppAutoscalerMetricChartSignalConfigService);

  parentUrl: string;
  applicationName$!: Observable<string>;

  // Re-exposed for template binding so the time-window dropdown can
  // read/write the selected window.
  windowValue = this.chartConfig.windowValue;
  windows = this.chartConfig.windows;

  public listConfig: WritableSignal<SignalListConfig<AutoscalerMetricChartRow> | undefined> = signal(undefined);

  constructor() {
    this.parentUrl = `/applications/${this.applicationService.cfGuid}/${this.applicationService.appGuid}/autoscale`;

    this.chartConfig.initialize(this.applicationService.cfGuid, this.applicationService.appGuid);

    this.listConfig.set({
      pagedItems: this.chartConfig.view.pagedItems,
      totalFilteredResults: this.chartConfig.view.totalFilteredResults,
      totalPages: this.chartConfig.view.totalPages,
      pageIndex: this.chartConfig.pageIndex,
      pageSize: this.chartConfig.pageSize,
      isAnyLoading: computed(() => !this.chartConfig.hasLoadedOnce()),
      errorsByCnsi: signal(new Map()),
      // Single column, used for table-mode rendering AND as the card
      // title source. Card mode is the default; the chart itself lives
      // in the projected `cardTemplate` (see HTML).
      columns: [
        {
          header: 'Metric type',
          key: 'name',
          sortField: (row: AutoscalerMetricChartRow) =>
            AutoscalerConstants.getMetricFromMetricId(row.metadata.guid),
          render: (row: AutoscalerMetricChartRow) =>
            AutoscalerConstants.getMetricFromMetricId(row.metadata.guid),
          widthHint: '24rem',
        },
      ],
      getRowKey: (row: AutoscalerMetricChartRow) => row.metadata.guid,
      emptyMessage: 'There are no metrics defined in the policy',
      emptyFilterMessage: 'No metrics match the current filter',
      loadingMessage: 'Loading metric charts…',
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48],
      },
      nameFilter: this.chartConfig.nameFilter,
      onRefresh: () => this.chartConfig.refresh(),
      onClear: () => this.chartConfig.clearFilters(),
      viewMode: this.chartConfig.viewMode,
      sort: this.chartConfig.sort,
      hidePagerWhenSingle: true,
    });
  }

  ngOnInit() {
    this.applicationName$ = this.applicationService.app$.pipe(
      map(({ entity }) => entity ? entity.entity.name : null),
      publishReplay(1),
      refCount()
    );
    void this.chartConfig.loadAll();
    this.cdr.markForCheck();
  }

  onWindowChange(value: string): void {
    this.chartConfig.setWindow(value);
  }
}
