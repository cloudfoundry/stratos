import { RouterNav } from '../../store/actions/router.actions';
import { DeleteRoute, UnmapRoute } from '../../store/actions/route.actions';
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
import { CfAppEvnVarsDataSource } from '../data-sources/cf-app-variables-data-source';
import { Injectable } from '@angular/core';
import { EntityInfo } from '../../store/types/api.types';
import {
  IBaseListAction,
  IGlobalListAction,
  IListAction,
  IListConfig,
  IMultiListAction,
  ListViewTypes,
} from '../components/list/list.component';
import { TableCellActionsComponent } from '../components/table/table-cell-actions/table-cell-actions.component';
import { ConfirmationDialogService, ConfirmationDialog } from '../components/confirmation-dialog.service';
import { getRoute } from '../../features/applications/routes/routes.helper';

@Injectable()
export class CfAppRoutesListConfigService implements IListConfig<EntityInfo> {
  isLocal?: boolean;
  routesDataSource: CfAppRoutesDataSource;

  private multiListActionDelete: IMultiListAction<EntityInfo> = {
    action: (items: EntityInfo[]) => {
      if (items.length === 1) {
        this.deleteSingleRoute(items[0]);
      } else {
        const confirmation = new ConfirmationDialog(
          'Delete Routes from Application',
          `Are you sure you want to delete ${items.length} routes?`,
          'Delete All');
        this.confirmDialog.open(confirmation, () => items.forEach(item => this.dispatchDeleteAction(item)));
      }
    },
    icon: 'delete',
    label: 'Delete',
    description: 'Unmap and delete route',
    visible: (row: EntityInfo) => true,
    enabled: (row: EntityInfo) => true,
  };

  private multiListActionUnmap: IMultiListAction<EntityInfo> = {
    action: (items: EntityInfo[]) => {
      if (items.length === 1) {
        this.unmapSingleRoute(items[0]);
      } else {
        const confirmation = new ConfirmationDialog(
          'Unmap Routes from Application',
          `Are you sure you want to unmap ${items.length} routes?`,
          'Unmap All');
        this.confirmDialog.open(confirmation, () => items.forEach(item => this.dispatchUnmapAction(item)));
      }
    },
    icon: 'block',
    label: 'Unmap',
    description: 'Unmap route',
    visible: (row: EntityInfo) => true,
    enabled: (row: EntityInfo) => true,
  };


  private listActionDelete: IListAction<EntityInfo> = {
    action: (item: EntityInfo) => this.deleteSingleRoute(item),
    icon: 'delete',
    label: 'Delete',
    description: 'Unmap and delete route',
    visible: (row: EntityInfo) => true,
    enabled: (row: EntityInfo) => true,
  };

  private listActionUnmap: IListAction<EntityInfo> = {
    action: (item: EntityInfo) => this.unmapSingleRoute(item),
    icon: 'block',
    label: 'Unmap',
    description: 'Unmap route',
    visible: (row: EntityInfo) => true,
    enabled: (row: EntityInfo) => true,
  };

  private listActionAdd: IGlobalListAction<EntityInfo> = {
    action: () => {
      this.store.dispatch(new RouterNav({ path: ['applications', this.appService.cfGuid, this.appService.appGuid, 'add-route'] }));
    },
    icon: 'add',
    label: 'Add',
    description: 'Add new route',
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
    {
      columnId: 'edit',
      headerCell: () => 'Actions',
      cellComponent: TableCellActionsComponent,
      class: 'app-table__cell--table-column-edit',
      cellFlex: '1'
    },
  ];

  pageSizeOptions = [9, 45, 90];
  viewType = ListViewTypes.TABLE_ONLY;

  dispatchDeleteAction = route => this.store.dispatch(
    new DeleteRoute(route.entity.guid, this.routesDataSource.cfGuid)
  )
  dispatchUnmapAction = route => this.store.dispatch(
    new UnmapRoute(route.entity.guid, this.routesDataSource.appGuid, this.routesDataSource.cfGuid)
  )
  getGlobalActions = () => [this.listActionAdd];
  getMultiActions = () => [this.multiListActionUnmap, this.multiListActionDelete];
  getSingleActions = () => [this.listActionDelete, this.listActionUnmap];
  getColumns = () => this.columns;
  getDataSource = () => this.routesDataSource;
  getFiltersConfigs = () => [];
  getMultiFiltersConfigs = () => [];

  constructor(
    private store: Store<AppState>,
    private appService: ApplicationService,
    private confirmDialog: ConfirmationDialogService
  ) {
    this.routesDataSource = new CfAppRoutesDataSource(this.store, this.appService);
  }

  private deleteSingleRoute(item: EntityInfo) {
    const routeUrl = getRoute(item);
    const confirmation = new ConfirmationDialog(
      'Delete Route',
      `Are you sure you want to delete the route \'${routeUrl}\'?`,
      'Delete');
    this.confirmDialog.open(confirmation, () => this.dispatchDeleteAction(item));
  }

  private unmapSingleRoute(item: EntityInfo) {
    const routeUrl = getRoute(item);
    const confirmation = new ConfirmationDialog(
      'Unmap Route from Application',
      `Are you sure you want to unmap the route \'${routeUrl}\'?`,
      'Unmap');
    this.confirmDialog.open(confirmation, () => this.dispatchUnmapAction(item));
  }
}
