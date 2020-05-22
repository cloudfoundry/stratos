import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { first, tap } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  BooleanIndicatorType,
} from '../../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import {
  TableCellBooleanIndicatorComponent,
  TableCellBooleanIndicatorComponentConfig,
} from '../../../../../../../core/src/shared/components/list/list-table/table-cell-boolean-indicator/table-cell-boolean-indicator.component';
import { ITableColumn } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import { ListViewTypes } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { ListView } from '../../../../../../../store/src/actions/list.actions';
import { PaginationMonitorFactory } from '../../../../../../../store/src/monitors/pagination-monitor.factory';
import { IMetricVectorResult } from '../../../../../../../store/src/types/base-metric.types';
import { IMetricCell } from '../../../../../../../store/src/types/metric.types';
import { CfCellHelper } from '../../../../../features/cloud-foundry/cf-cell.helpers';
import { ActiveRouteCfCell } from '../../../../../features/cloud-foundry/cf-page.types';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { CfCellsDataSource } from './cf-cells-data-source';

// tslint:disable:max-line-length

// tslint:enable:max-line-length

@Injectable()
export class CfCellsListConfigService extends BaseCfListConfig<IMetricVectorResult<IMetricCell>> {

  dataSource: CfCellsDataSource;
  defaultView = 'table' as ListView;
  viewType = ListViewTypes.TABLE_ONLY;
  enableTextFilter = true;
  text = {
    title: null,
    filter: 'Search by id',
    noEntries: 'There are no cells'
  };
  private init$: Observable<any>;

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
    store: Store<CFAppState>,
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

  getInitialised = () => this.init$;
  getColumns = () => this.columns;
  getDataSource = () => this.dataSource;
}
