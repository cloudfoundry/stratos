import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { ActiveRouteCfCell } from '../../../../../features/cloud-foundry/cf-page.types';
import { ListView } from '../../../../../store/actions/list.actions';
import { AppState } from '../../../../../store/app-state';
import { IMetricVectorResult } from '../../../../../store/types/base-metric.types';
import { IMetricCell } from '../../../../../store/types/metric.types';
import { BooleanIndicatorType } from '../../../boolean-indicator/boolean-indicator.component';
import {
  TableCellBooleanIndicatorComponent,
  TableCellBooleanIndicatorComponentConfig,
} from '../../list-table/table-cell-boolean-indicator/table-cell-boolean-indicator.component';
import { ITableColumn } from '../../list-table/table.types';
import { ListViewTypes } from '../../list.component.types';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { CfCellsDataSource } from './cf-cells-data-source';

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

  constructor(store: Store<AppState>, private activeRouteCfCell: ActiveRouteCfCell) {
    super();
    this.dataSource = new CfCellsDataSource(store, activeRouteCfCell.cfGuid, this);
  }

  getColumns = () => this.columns;
  getDataSource = () => this.dataSource;
}
