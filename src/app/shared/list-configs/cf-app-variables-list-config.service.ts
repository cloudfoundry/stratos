import { ITableColumn } from '../components/table/table.types';
import { TableCellEditComponent } from '../components/table/table-cell-edit/table-cell-edit.component';
import {
  TableCellEditVariableComponent,
} from '../components/table/custom-cells/table-cell-edit-variable/table-cell-edit-variable.component';
import { TableCellSelectComponent } from '../components/table/table-cell-select/table-cell-select.component';
import { TableHeaderSelectComponent } from '../components/table/table-header-select/table-header-select.component';
import { ApplicationService } from '../../features/applications/application.service';
import { AppVariablesDelete } from '../../store/actions/app-variables.actions';
import { Store } from '@ngrx/store';
import { AppState } from '../../store/app-state';
import { AppEnvVar, CfAppEvnVarsDataSource } from '../data-sources/cf-app-variables-data-source';
import { Injectable } from '@angular/core';
import { EntityInfo } from '../../store/types/api.types';
import {
  IBaseListAction,
  IGlobalListAction,
  IListAction,
  IListConfig,
  IMultiListAction,
} from '../components/list/list.component';

@Injectable()
export class CfAppVariablesListConfigService implements IListConfig<AppEnvVar> {
  envVarsDataSource: CfAppEvnVarsDataSource;

  private multiListActionDelete: IMultiListAction<AppEnvVar> = {
    action: (items: AppEnvVar[]) => {
      this.dispatchDeleteAction();
    },
    icon: 'delete',
    label: 'Delete',
    description: '',
    visible: (row: AppEnvVar) => true,
    enabled: (row: AppEnvVar) => true,
  };

  private listActionDelete: IListAction<AppEnvVar> = {
    action: (item: AppEnvVar) => {
      this.dispatchDeleteAction();
    },
    icon: 'delete',
    label: 'Delete',
    description: '',
    visible: (row: AppEnvVar) => true,
    enabled: (row: AppEnvVar) => true,
  };

  columns: Array<ITableColumn<AppEnvVar>> = [
    {
      columnId: 'select', headerCellComponent: TableHeaderSelectComponent, cellComponent: TableCellSelectComponent,
      class: 'table-column-select', cellFlex: '1'
    },
    {
      columnId: 'name', headerCell: () => 'Name', cell: (row: AppEnvVar) => `${row.name}`, sort: true, cellFlex: '3'
    },
    {
      columnId: 'value', headerCell: () => 'Value', cellComponent: TableCellEditVariableComponent, sort: true, cellFlex: '4'
    },
    {
      columnId: 'edit', headerCell: () => '', cellComponent: TableCellEditComponent, class: 'table-column-edit', cellFlex: '1'
    },
  ];


  private dispatchDeleteAction() {
    this.store.dispatch(
      new AppVariablesDelete(
        this.envVarsDataSource.cfGuid,
        this.envVarsDataSource.appGuid,
        this.envVarsDataSource.rows,
        Array.from(this.envVarsDataSource.selectedRows.values()
        ))
    );
  }

  getGlobalActions = () => null;
  getMultiActions = () => [this.multiListActionDelete];
  getSingleActions = () => [this.listActionDelete];
  getColumns = () => this.columns;
  getDataSource = () => this.envVarsDataSource;

  constructor(
    private store: Store<AppState>,
    private appService: ApplicationService
  ) {
    this.envVarsDataSource = new CfAppEvnVarsDataSource(this.store, this.appService);
  }

}
