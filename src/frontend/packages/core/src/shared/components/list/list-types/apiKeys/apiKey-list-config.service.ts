import { Injectable } from '@angular/core';
import { SortDirection } from '@angular/material/sort';
import { Store } from '@ngrx/store';
import moment from 'moment';

import { ListView } from '../../../../../../../store/src/actions/list.actions';
import { ApiKey } from '../../../../../../../store/src/apiKey.types';
import { AppState } from '../../../../../../../store/src/app-state';
import { stratosEntityCatalog } from '../../../../../../../store/src/stratos-entity-catalog';
import { ConfirmationDialogConfig } from '../../../confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../confirmation-dialog.service';
import { ITableColumn } from '../../list-table/table.types';
import { IListAction, IListConfig, ListViewTypes } from '../../list.component.types';
import { ApiKeyDataSource } from './apiKey-data-source';

@Injectable()
export class ApiKeyListConfigService implements IListConfig<ApiKey> {

  private static comment = 'comment';
  private static lastUsedName = 'last_used';

  private deleteAction: IListAction<ApiKey> = {
    action: (item: ApiKey) => {
      const confirmation = new ConfirmationDialogConfig(
        'Delete Key',
        `Are you sure?`,
        'Delete',
        true
      );
      this.confirmDialog.open(
        confirmation,
        () => stratosEntityCatalog.apiKey.api.delete(item.guid)
      );
    },
    label: 'Delete',
    description: 'Delete API Key',
  }
  private singleActions: IListAction<ApiKey>[] = [this.deleteAction];


  public readonly columns: ITableColumn<ApiKey>[] = [
    {
      columnId: ApiKeyListConfigService.comment,
      headerCell: () => 'Description',
      cellDefinition: {
        valuePath: 'comment'
      },
      sort: {
        type: 'sort',
        orderKey: ApiKeyListConfigService.comment,
        field: 'comment'
      },
      cellFlex: '2'
    },
    {
      columnId: ApiKeyListConfigService.lastUsedName,
      headerCell: () => 'Last Used',
      cellDefinition: {
        getValue: row => row.last_used ? moment(row.last_used).format('LLL') : null
      },
      sort: {
        type: 'sort',
        orderKey: ApiKeyListConfigService.lastUsedName,
        field: 'last_used'
      },
      cellFlex: '1'
    }
  ];

  isLocal = true;
  dataSource: ApiKeyDataSource;
  viewType = ListViewTypes.TABLE_ONLY;
  defaultView = 'table' as ListView;
  text = {
    title: '',
    filter: 'Filter API Keys'
  };
  enableTextFilter = true;

  constructor(
    store: Store<AppState>,
    private confirmDialog: ConfirmationDialogService,
  ) {
    const action = stratosEntityCatalog.apiKey.actions.getMultiple();
    action.initialParams = {
      'order-direction': 'desc' as SortDirection,
      'order-direction-field': 'comment'
    };
    this.dataSource = new ApiKeyDataSource(
      store,
      this,
      action
    );
  }

  public getGlobalActions = () => [];
  public getMultiActions = () => [];
  public getSingleActions = () => this.singleActions;
  public getColumns = () => this.columns;
  public getDataSource = () => this.dataSource;
  public getMultiFiltersConfigs = () => [];

}
