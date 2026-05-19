import { Component, ChangeDetectionStrategy, WritableSignal, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  CustomTooltipDirective,
  CardWrapperComponent,
  CardContentComponent,
  SignalListComponent,
  SignalListConfig,
  SignalListPillColor,
} from '@stratosui/core';

import { StratosStatus } from '../../../../../../../../store/src/types/shared.types';
import {
  CfCellHealthEntry,
  CfCellHealthSignalConfigService,
  CfCellHealthState,
} from '../../../../../../shared/components/list/list-types/cf-cell-health/cf-cell-health-signal-config.service';
import { CloudFoundryCellService } from '../cloud-foundry-cell.service';
import { CardStatusComponent } from '../../../../../../../../core/src/shared/components/cards/card-status/card-status.component';
import { MetadataItemComponent } from '../../../../../../../../core/src/shared/components/metadata-item/metadata-item.component';
import { BooleanIndicatorComponent } from '../../../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { TileGridComponent } from '../../../../../../../../core/src/shared/components/tile/tile-grid/tile-grid.component';
import { TileGroupComponent } from '../../../../../../../../core/src/shared/components/tile/tile-group/tile-group.component';
import { TileComponent } from '../../../../../../../../core/src/shared/components/tile/tile/tile.component';
import { CardNumberMetricComponent } from '../../../../../../../../core/src/shared/components/cards/card-number-metric/card-number-metric.component';

@Component({
  selector: 'app-cloud-foundry-cell-summary',
  templateUrl: './cloud-foundry-cell-summary.component.html',
  styleUrls: ['./cloud-foundry-cell-summary.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CustomTooltipDirective,
    CardWrapperComponent,
    CardContentComponent,
    CardStatusComponent,
    MetadataItemComponent,
    BooleanIndicatorComponent,
    TileGridComponent,
    TileGroupComponent,
    TileComponent,
    CardNumberMetricComponent,
    SignalListComponent,
  ],
})
export class CloudFoundryCellSummaryComponent {
  cfCellService = inject(CloudFoundryCellService);
  private healthConfig = inject(CfCellHealthSignalConfigService);
  private datePipe = inject(DatePipe);

  public status$: Observable<StratosStatus>;
  public healthListConfig: WritableSignal<SignalListConfig<CfCellHealthEntry> | undefined> = signal(undefined);

  constructor() {
    const cfCellService = this.cfCellService;

    this.status$ = cfCellService.healthy$.pipe(
      map(health => {
        if (health === undefined) {
          return StratosStatus.NONE;
        }
        return health === '0' ? StratosStatus.OK : StratosStatus.ERROR;
      })
    );

    this.healthConfig.initialize(cfCellService.cfGuid, cfCellService.cellId);
    void this.healthConfig.loadAll();

    const stateLabel = (r: CfCellHealthEntry): string => {
      switch (r.state) {
        case CfCellHealthState.INITIAL_HEALTHY:
        case CfCellHealthState.HEALTHY:
          return 'Healthy';
        case CfCellHealthState.INITIAL_UNHEALTHY:
        case CfCellHealthState.UNHEALTHY:
          return 'Unhealthy';
        default:
          return '';
      }
    };
    const stateColor = (r: CfCellHealthEntry): SignalListPillColor => {
      const healthy = r.state === CfCellHealthState.HEALTHY || r.state === CfCellHealthState.INITIAL_HEALTHY;
      return healthy ? 'success' : 'danger';
    };

    this.healthListConfig.set({
      pagedItems: this.healthConfig.view.pagedItems,
      totalFilteredResults: this.healthConfig.view.totalFilteredResults,
      totalPages: this.healthConfig.view.totalPages,
      pageIndex: this.healthConfig.pageIndex,
      pageSize: this.healthConfig.pageSize,
      isAnyLoading: computed(() => this.healthConfig.availability() === undefined),
      errorsByCnsi: signal(new Map()),
      columns: [
        {
          header: 'Date/Time', key: 'dateTime', sortField: 'timestamp',
          kind: 'text',
          render: (r: CfCellHealthEntry) => this.datePipe.transform(r.timestamp * 1000, 'medium') ?? '',
          widthHint: '20rem',
        },
        {
          header: 'Cell Health Updated', key: 'state', sortField: 'state',
          kind: 'dot',
          pillColor: stateColor,
          render: stateLabel,
          widthHint: '12rem',
        },
      ],
      getRowKey: (r: CfCellHealthEntry) => `${r.timestamp}:${r.state}`,
      emptyMessage: 'Cell has no health history',
      loadingMessage: 'Loading cell health…',
      hidePagerWhenSingle: true,
      onRefresh: () => this.healthConfig.refresh(),
      sort: this.healthConfig.sort,
    });
  }
}
