import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { ApplicationService } from '../../../../../features/applications/application.service';
import { AppVariablesDelete } from '../../../../../store/actions/app-variables.actions';
import { AppState } from '../../../../../store/app-state';
import { TableCellEditComponent } from '../../list-table/table-cell-edit/table-cell-edit.component';
import { TableCellSelectComponent } from '../../list-table/table-cell-select/table-cell-select.component';
import { TableHeaderSelectComponent } from '../../list-table/table-header-select/table-header-select.component';
import { ITableColumn } from '../../list-table/table.types';
import { IListAction, IListConfig, IMultiListAction, ListViewTypes } from '../../list.component.types';
import { CfAppEvnVarsDataSource, ListAppEnvVar } from './cf-app-variables-data-source';
import { TableCellEditVariableComponent } from './table-cell-edit-variable/table-cell-edit-variable.component';

@Injectable()
export class CfAppVariablesListConfigService implements IListConfig<ListAppEnvVar> {
  envVarsDataSource: CfAppEvnVarsDataSource;

  private multiListActionDelete: IMultiListAction<ListAppEnvVar> = {
    action: (items: ListAppEnvVar[]) => {
      this.dispatchDeleteAction();
    },
    icon: 'delete',
    label: 'Delete',
    description: '',
    visible: (row: ListAppEnvVar) => true,
    enabled: (row: ListAppEnvVar) => true,
  };

  private listActionDelete: IListAction<ListAppEnvVar> = {
    action: (item: ListAppEnvVar) => {
      this.dispatchDeleteAction();
    },
    icon: 'delete',
    label: 'Delete',
    description: '',
    visible: (row: ListAppEnvVar) => true,
    enabled: (row: ListAppEnvVar) => true,
  };

  columns: Array<ITableColumn<ListAppEnvVar>> = [
    {
      columnId: 'select', headerCellComponent: TableHeaderSelectComponent, cellComponent: TableCellSelectComponent,
      class: 'table-column-select', cellFlex: '1'
    },
    {
      columnId: 'name', headerCell: () => 'Name', cell: (row) => `${row.name}`, sort: true, cellFlex: '5'
    },
    {
      columnId: 'value', headerCell: () => 'Value', cellComponent: TableCellEditVariableComponent, sort: true, cellFlex: '10'
    },
    {
      columnId: 'edit', headerCell: () => '', cellComponent: TableCellEditComponent, class: 'app-table__cell--table-column-edit',
      cellFlex: '2'
    },
  ];

  pageSizeOptions = [9, 45, 90];
  viewType = ListViewTypes.TABLE_ONLY;
  text: {
    title: 'Environment Variables', filter: 'Filter Variables'
  };
  enableTextFilter: true;

  private dispatchDeleteAction() {
    this.store.dispatch(
      new AppVariablesDelete(
        this.envVarsDataSource.cfGuid,
        this.envVarsDataSource.appGuid,
        this.envVarsDataSource.entityLettabledRows,
        Array.from(this.envVarsDataSource.selectedRows.values()
        ))
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
    this.envVarsDataSource = new CfAppEvnVarsDataSource(this.store, this.appService);
  }

}
