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

  private deleteAction: IListAction<ApiKey> = {
    action: (item: ApiKey) => stratosEntityCatalog.apiKey.api.delete(item.guid),
    label: 'Delete',
    description: 'Delete API Key',
  }
  private singleActions: IListAction<ApiKey>[] = [this.deleteAction];

  // TODO: RC Flesh out, get correct paths
  public readonly columns: ITableColumn<ApiKey>[] = [
    {
      columnId: 'guid',
      headerCell: () => 'guid',
      cellDefinition: {
        valuePath: 'guid'
      },
      sort: {
        type: 'sort',
        orderKey: 'guid',
        field: 'guid'
      },
      cellFlex: '2'
    },
    {
      columnId: 'comment',
      headerCell: () => 'comment',
      cellDefinition: {
        valuePath: 'comment'
      },
      sort: {
        type: 'sort',
        orderKey: 'comment',
        field: 'comment'
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
  enableTextFilter = true; // TODO: RC

  constructor(
    store: Store<AppState>,
  ) {
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
