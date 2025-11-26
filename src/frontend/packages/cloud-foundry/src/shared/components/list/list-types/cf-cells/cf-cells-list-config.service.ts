// tslint:disable:max-line-length
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store'
import type { GeneralEntityAppState } from '@stratosui/store';;
import type { Observable } from 'rxjs';
import { first, map, tap } from 'rxjs/operators';

import type { FetchCFCellMetricsPaginatedAction } from '../../../../../actions/cf-metrics.actions';
import type { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  BooleanIndicatorType,
  TableCellBooleanIndicatorComponent,
  type TableCellBooleanIndicatorComponentConfig,
  type ITableColumn,
  ListViewTypes,
} from '@stratosui/core';
import type { ListView } from '../../../../../../../store/src/actions/list.actions';
import type { PaginationMonitorFactory } from '../../../../../../../store/src/monitors/pagination-monitor.factory';
import type { IMetricVectorResult } from '../../../../../../../store/src/types/base-metric.types';
import type { IMetricCell } from '../../../../../../../store/src/types/metric.types';
import { CfCellHelper } from '../../../../../features/cf/cf-cell.helpers';
import type { ActiveRouteCfCell } from '../../../../../features/cf/cf-page.types';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { CfCellsDataSource } from './cf-cells-data-source';


// tslint:enable:max-line-length

@Injectable({
  providedIn: 'root'
})
export class CfCellsListConfigService extends BaseCfListConfig<IMetricVectorResult<IMetricCell>> {

  dataSource!: CfCellsDataSource;
  defaultView = 'table' as ListView;
  viewType = ListViewTypes.TABLE_ONLY;
  enableTextFilter = true;
  text = {
    title: null as string,
    filter: 'Search by id',
    noEntries: 'There are no cells'
  };
  private init$: Observable<FetchCFCellMetricsPaginatedAction>;

  private boolIndicatorConfig: TableCellBooleanIndicatorComponentConfig<IMetricVectorResult<IMetricCell>> = {
    // "0 signifies healthy, and 1 signifies unhealthy"
    isEnabled: (row: IMetricVectorResult<IMetricCell>) => row ? row.value[1] === '0' : false,
    type: BooleanIndicatorType.enabledDisabled,
    subtle: false,
    showText: false
  };

  columns: Array<ITableColumn<IMetricVectorResult<IMetricCell>>> = [
    {
      columnId: 'id',
      headerCell: () => 'ID',
      cellDefinition: {
        valuePath: CfCellsDataSource.cellIdPath,
        getLink: (row: IMetricVectorResult<IMetricCell>) =>
          `/cloud-foundry/${this.activeRouteCfCell.cfGuid}/cells/${row.metric.bosh_job_id}/summary`
      },
      cellFlex: '1',
      sort: {
        type: 'sort',
        orderKey: 'id',
        field: CfCellsDataSource.cellIdPath
      }
    },
    {
      columnId: 'name',
      headerCell: () => 'Name',
      cellDefinition: {
        valuePath: CfCellsDataSource.cellNamePath
      },
      cellFlex: '1',
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: CfCellsDataSource.cellNamePath
      }
    },
    {
      columnId: 'deployment',
      headerCell: () => 'Deployment',
      cellDefinition: {
        valuePath: CfCellsDataSource.cellDeploymentPath
      },
      cellFlex: '1',
      sort: {
        type: 'sort',
        orderKey: 'deployment',
        field: CfCellsDataSource.cellDeploymentPath
      }
    },
    {
      columnId: 'healthy',
      headerCell: () => 'Healthy',
      cellComponent: TableCellBooleanIndicatorComponent,
      cellConfig: this.boolIndicatorConfig,
      cellFlex: '1',
      sort: {
        type: 'sort',
        orderKey: 'healthy',
        field: CfCellsDataSource.cellHealthyPath
      }
    },
  ];

  constructor(
    store: Store<GeneralEntityAppState>,
    private activeRouteCfCell: ActiveRouteCfCell,
    paginationMonitorFactory: PaginationMonitorFactory) {
    super();
    const cellHelper = new CfCellHelper(store, paginationMonitorFactory);
    this.init$ = cellHelper.createCellMetricAction(activeRouteCfCell.cfGuid).pipe(
      first(),
      tap(action => {
        this.dataSource = new CfCellsDataSource(store, this, action);
      })
    );
  }

  getInitialised = (): Observable<boolean> => this.init$.pipe(map(() => true));
  getColumns = () => this.columns;
  getDataSource = () => this.dataSource;
}
