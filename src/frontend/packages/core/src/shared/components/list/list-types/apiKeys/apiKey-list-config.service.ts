import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter } from 'rxjs/operators';

import { ListView } from '../../../../../../../store/src/actions/list.actions';
import { ApiKey } from '../../../../../../../store/src/apiKey.types';
import { AppState } from '../../../../../../../store/src/app-state';
import { stratosEntityCatalog } from '../../../../../../../store/src/stratos-entity-catalog';
import { ITableColumn } from '../../list-table/table.types';
import { IListAction, IListConfig, ListViewTypes } from '../../list.component.types';
import { ApiKeyDataSource } from './apiKey-data-source';



@Injectable()
export class ApiKeyListConfigService implements IListConfig<ApiKey> {

  private singleActions: IListAction<ApiKey>[];

  // TODO: RC Flesh out, get correct paths
  public readonly columns: ITableColumn<ApiKey>[] = [
    {
      columnId: 'id',
      headerCell: () => 'ID',
      cellDefinition: {
        valuePath: 'unknown'
      },
      sort: {
        type: 'sort',
        orderKey: 'id',
        field: 'unknown'
      },
      cellFlex: '2'
    },
    {
      columnId: 'type',
      headerCell: () => 'Type',
      cellDefinition: {
        valuePath: 'unknown'
      },
      sort: {
        type: 'sort',
        orderKey: 'type',
        field: 'cnsi_type'
      },
      cellFlex: '2'
    },
  ];

  isLocal = true;
  dataSource: ApiKeyDataSource;
  viewType = ListViewTypes.TABLE_ONLY;
  defaultView = 'table' as ListView;
  text = {
    title: '',
    filter: 'Filter API Keys'
  };
  enableTextFilter = false; // TODO: RC

  constructor(
    store: Store<AppState>,
  ) {
    this.singleActions = []; // TODO: RC add 'delete'
    this.dataSource = new ApiKeyDataSource(
      store,
      this,
      stratosEntityCatalog.apiKey.actions.getMultiple()
    );
  }

  public getGlobalActions = () => [];
  public getMultiActions = () => [];
  public getSingleActions = () => this.singleActions;
  public getColumns = () => this.columns;
  public getDataSource = () => this.dataSource;
  public getMultiFiltersConfigs = () => [];

}
