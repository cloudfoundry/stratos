import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { ApplicationService } from '../../../../../features/applications/application.service';
import { AppVariablesDelete } from '../../../../../store/actions/app-variables.actions';
import { AppState } from '../../../../../store/app-state';
import { TableCellEditComponent } from '../../list-table/table-cell-edit/table-cell-edit.component';
import { ITableColumn } from '../../list-table/table.types';
import {
  defaultPaginationPageSizeOptionsTable,
  IListAction,
  IListConfig,
  IMultiListAction,
  ListViewTypes,
} from '../../list.component.types';
import { CfAppVariablesDataSource, ListAppEnvVar } from './cf-app-variables-data-source';
import { TableCellEditVariableComponent } from './table-cell-edit-variable/table-cell-edit-variable.component';

@Injectable()
export class CfAppVariablesListConfigService implements IListConfig<ListAppEnvVar> {
  envVarsDataSource: CfAppVariablesDataSource;

  private multiListActionDelete: IMultiListAction<ListAppEnvVar> = {
    action: (items: ListAppEnvVar[]) => {
      this.dispatchDeleteAction(Array.from(this.envVarsDataSource.selectedRows.values()));
    },
    icon: 'delete',
    label: 'Delete',
    description: '',
    visible: (row: ListAppEnvVar) => true,
    enabled: (row: ListAppEnvVar) => true,
  };

  private listActionDelete: IListAction<ListAppEnvVar> = {
    action: (item: ListAppEnvVar) => {
      this.dispatchDeleteAction([item]);
    },
    icon: 'delete',
    label: 'Delete',
    description: '',
    visible: (row: ListAppEnvVar) => true,
    enabled: (row: ListAppEnvVar) => true,
  };

  columns: Array<ITableColumn<ListAppEnvVar>> = [
    {
      columnId: 'name', headerCell: () => 'Name',
      cellDefinition: {
        getValue: (row) => `${row.name}`
      },
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'name'
      }, cellFlex: '5'
    },
    {
      columnId: 'value', headerCell: () => 'Value', cellComponent: TableCellEditVariableComponent, sort: {
        type: 'sort',
        orderKey: 'value',
        field: 'value'
      }, cellFlex: '10'
    },
    {
      columnId: 'edit', headerCell: () => '', cellComponent: TableCellEditComponent, class: 'app-table__cell--table-column-edit',
      cellFlex: '2'
    },
  ];

  viewType = ListViewTypes.TABLE_ONLY;
  text = {
    title: 'Environment Variables', filter: 'Search by name', noEntries: 'There are no variables'
  };
  enableTextFilter = true;

  private dispatchDeleteAction(newValues: ListAppEnvVar[]) {
    this.store.dispatch(
      new AppVariablesDelete(
        this.envVarsDataSource.cfGuid,
        this.envVarsDataSource.appGuid,
        this.envVarsDataSource.transformedEntities,
        newValues)
    );
  }

  getGlobalActions = () => null;
  getMultiActions = () => [this.multiListActionDelete];
  getSingleActions = () => [this.listActionDelete];
  getColumns = () => this.columns;
  getDataSource = () => this.envVarsDataSource;
  getMultiFiltersConfigs = () => [];

  constructor(
    private store: Store<AppState>,
    private appService: ApplicationService
  ) {
    this.envVarsDataSource = new CfAppVariablesDataSource(this.store, this.appService, this);
  }

}
