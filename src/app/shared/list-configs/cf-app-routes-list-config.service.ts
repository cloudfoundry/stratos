import { DeleteRoute } from '../../store/actions/route.actions';
import {
    TableCellTCPRouteComponent,
} from '../components/table/custom-cells/table-cell-tcproute/table-cell-tcproute.component';
import { TableCellRouteComponent } from '../components/table/custom-cells/table-cell-route/table-cell-route.component';
import { CfAppRoutesDataSource } from '../data-sources/cf-app-routes-data-source';
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
export class CfAppRoutesListConfigService implements IListConfig<EntityInfo> {
  routesDataSource: CfAppRoutesDataSource;


  private multiListActionDelete: IMultiListAction<EntityInfo> = {
    action: (items: EntityInfo[]) => {
      this.dispatchDeleteAction();
    },
    icon: 'delete',
    label: 'Delete',
    description: '',
    visible: (row: EntityInfo) => true,
    enabled: (row: EntityInfo) => true,
  };

  private listActionDelete: IListAction<EntityInfo> = {
    action: (item: EntityInfo) => {
      this.dispatchDeleteAction();
    },
    icon: 'delete',
    label: 'Delete',
    description: '',
    visible: (row: EntityInfo) => true,
    enabled: (row: EntityInfo) => true,
  };
  columns: Array<ITableColumn<EntityInfo>> = [
    {
      columnId: 'select', headerCellComponent: TableHeaderSelectComponent, cellComponent: TableCellSelectComponent,
      class: 'table-column-select', cellFlex: '1'
    },
    {
      columnId: 'route', headerCell: () => 'Route',
       cellComponent: TableCellRouteComponent, sort: true, cellFlex: '3'
    },
    {
      columnId: 'tcproute', headerCell: () => 'TCP Route',
      cellComponent: TableCellTCPRouteComponent,
      sort: true, cellFlex: '3'
    },
  ];

  pageSizeOptions = [9, 45, 90];

  private dispatchDeleteAction() {
    this.routesDataSource.selectedRows.forEach(route =>
      this.store.dispatch( new DeleteRoute( route.entity.guid, this.routesDataSource.cfGuid))
    );
  }

  getGlobalActions = () => null;
  getMultiActions = () => [this.multiListActionDelete];
  getSingleActions = () => [this.listActionDelete];
  getColumns = () => this.columns;
  getDataSource = () => this.routesDataSource;
  getFiltersConfigs = () => [];

  constructor(
    private store: Store<AppState>,
    private appService: ApplicationService
  ) {
    this.routesDataSource = new CfAppRoutesDataSource(this.store, this.appService);
  }

}
