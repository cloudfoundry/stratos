/* tslint:disable:max-line-length */
import type { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Observable } from 'rxjs';
import { first, map, tap } from 'rxjs/operators';

import {
  BooleanIndicatorType,
  TableCellBooleanIndicatorComponent,
  type TableCellBooleanIndicatorComponentConfig,
  type ITableColumn,
  ListViewTypes,
} from '@stratosui/core';
import type { ListView } from '../../../../../../../store/src/actions/list.actions';
import type { PaginationMonitorFactory } from '../../../../../../../store/src/monitors/pagination-monitor.factory';
import type { GeneralEntityAppState } from '@stratosui/store';
import type { FetchCFCellMetricsPaginatedAction } from '../../../../../actions/cf-metrics.actions';
import type { CFAppState } from '../../../../../cf-app-state';
import { CfCellHelper } from '../../../../../features/cf/cf-cell.helpers';
import type {
  CloudFoundryCellService,
} from '../../../../../features/cf/tabs/cf-cells/cloud-foundry-cell/cloud-foundry-cell.service';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { CfCellHealthDataSource, type CfCellHealthEntry, CfCellHealthState } from './cf-cell-health-source';

// tslint:enable:max-line-length

@Injectable({
  providedIn: 'root'
})
export class CfCellHealthListConfigService extends BaseCfListConfig<CfCellHealthEntry> {

  dataSource!: CfCellHealthDataSource;
  defaultView = 'table' as ListView;
  viewType = ListViewTypes.TABLE_ONLY;
  enableTextFilter = false;
  text = {
    title: 'Cell Health History',
    noEntries: 'Cell has no health history'
  };
  private init$: Observable<FetchCFCellMetricsPaginatedAction>;

  private boolIndicatorConfig: TableCellBooleanIndicatorComponentConfig<CfCellHealthEntry> = {
    isEnabled: (row: CfCellHealthEntry) =>
      row ? row.state === CfCellHealthState.HEALTHY || row.state === CfCellHealthState.INITIAL_HEALTHY : false,
    type: BooleanIndicatorType.healthyUnhealthy,
    subtle: false,
    showText: true
  };

  constructor(
    private store: Store<GeneralEntityAppState>,
    cloudFoundryCellService: CloudFoundryCellService,
    private datePipe: DatePipe,
    private paginationMonitorFactory: PaginationMonitorFactory) {
    super();

    this.init$ = this.createMetricsAction(cloudFoundryCellService.cfGuid, cloudFoundryCellService.cellId).pipe(
      first(),
      tap(action => {
        this.dataSource = new CfCellHealthDataSource(this.store, this as unknown as BaseCfListConfig<CfCellHealthEntry>, action);
      })
    );
    this.showCustomTime = true;
  }

  private createMetricsAction(cfGuid: string, cellId: string): Observable<FetchCFCellMetricsPaginatedAction> {
    const cellHelper = new CfCellHelper(this.store, this.paginationMonitorFactory);
    return cellHelper.createCellMetricAction(cfGuid, cellId);
  }

  getInitialised = () => this.init$.pipe(map(() => true));
  getColumns = (): ITableColumn<CfCellHealthEntry>[] => [
    {
      columnId: 'dateTime',
      headerCell: () => 'Date/Time',
      cellFlex: '1',
      cellDefinition: {
        getValue: (entry: CfCellHealthEntry) => this.datePipe.transform(entry.timestamp * 1000, 'medium')
      },
      sort: {
        type: 'sort',
        orderKey: 'dateTime',
        field: 'timestamp'
      }
    },
    {
      columnId: 'state',
      headerCell: () => 'Cell Health Updated',
      cellComponent: TableCellBooleanIndicatorComponent,
      cellConfig: this.boolIndicatorConfig,
      cellFlex: '1',
      sort: {
        type: 'sort',
        orderKey: 'state',
        field: 'state'
      }
    },
  ];
  getDataSource = () => this.dataSource;
}
