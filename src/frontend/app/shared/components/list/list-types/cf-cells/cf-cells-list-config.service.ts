import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { ListView } from '../../../../../store/actions/list.actions';
import { AppState } from '../../../../../store/app-state';
import { IMetricVectorResult } from '../../../../../store/types/base-metric.types';
import { IMetricApplication } from '../../../../../store/types/metric.types';
import { getIntegerFieldSortFunction } from '../../data-sources-controllers/local-filtering-sorting';
import {
  TableCellBooleanIndicatorComponent,
  TableCellBooleanIndicatorComponentConfig,
} from '../../list-table/table-cell-boolean-indicator/table-cell-boolean-indicator.component';
import { ITableColumn } from '../../list-table/table.types';
import { IListAction, ListViewTypes } from '../../list.component.types';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { CfCellsDataSource } from './cf-cells-data-source';

@Injectable()
export class CfCellsListConfigService extends BaseCfListConfig<IMetricVectorResult<IMetricApplication>> {


  dataSource: CfCellsDataSource;
  defaultView = 'table' as ListView;
  viewType = ListViewTypes.TABLE_ONLY;
  enableTextFilter = true;
  text = {
    title: null,
    filter: 'Search by name',
    noEntries: 'There are no cells'
  };

  private boolIndicatorConfig: TableCellBooleanIndicatorComponentConfig<IMetricVectorResult<IMetricApplication>> = {
    // "0 signifies healthy, and 1 signifies unhealthy"
    isEnabled: (row: IMetricVectorResult<IMetricApplication>) => row ? row.value[1] === '0' : false,
    type: 'enabled-disabled',
    subtle: false,
    showText: false
  };

  private summaryAction: IListAction<IMetricVectorResult<IMetricApplication>> = {
    action: (cell) => {
      this.router.navigate([`cloud-foundry/${this.activeRouteCfOrgSpace.cfGuid}/cells/${cell.metric.bosh_job_id}`]);
    },
    label: 'Summary',
    description: ``
  };

  columns: Array<ITableColumn<IMetricVectorResult<IMetricApplication>>> = [
    {
      columnId: 'id',
      headerCell: () => 'ID',
      cellDefinition: {
        valuePath: CfCellsDataSource.cellIdPath
      },
      class: 'table-column-select',
      cellFlex: '0 0 100px',
      sort: getIntegerFieldSortFunction(CfCellsDataSource.cellIdPath)
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

  constructor(private store: Store<AppState>, private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace, private router: Router) {
    super();
    this.dataSource = new CfCellsDataSource(this.store, activeRouteCfOrgSpace.cfGuid, this);
  }

  getSingleActions = () => [this.summaryAction];
  getColumns = () => this.columns;
  getDataSource = () => this.dataSource;
}
