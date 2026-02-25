import { Injectable } from '@angular/core';
export type SortDirection = 'asc' | 'desc' | '';
import { Store } from '@ngrx/store';
import { ApiKey, stratosEntityCatalog, ListView, AppState } from '@stratosui/store';
import { format } from 'date-fns';

import { ConfirmationDialogConfig } from '../../../confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../confirmation-dialog.service';
import { ITableColumn } from '../../list-table/table.types';
import { IGlobalListAction, IListAction, IListConfig, IListMultiFilterConfig, IMultiListAction, ListViewTypes } from '../../list.component.types';
import { ApiKeyDataSource } from './apiKey-data-source';

@Injectable({
  providedIn: 'root'
})
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
  };
  private singleActions: IListAction<ApiKey>[] = [this.deleteAction];


  public readonly columns: ITableColumn<ApiKey>[] = [
    {
      columnId: ApiKeyListConfigService.comment,
      headerCell: (): string => 'Description',
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
      headerCell: (): string => 'Last Used',
      cellDefinition: {
        getValue: (row: ApiKey): string | null => row.last_used ? format(new Date(row.last_used), 'PPPp') : null
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

  public getGlobalActions = (): IGlobalListAction<ApiKey>[] => [];
  public getMultiActions = (): IMultiListAction<ApiKey>[] => [];
  public getSingleActions = (): IListAction<ApiKey>[] => this.singleActions;
  public getColumns = (): ITableColumn<ApiKey>[] => this.columns;
  public getDataSource(): ApiKeyDataSource {
    return this.dataSource;
  }
  public getMultiFiltersConfigs = (): IListMultiFilterConfig[] => [];

}
