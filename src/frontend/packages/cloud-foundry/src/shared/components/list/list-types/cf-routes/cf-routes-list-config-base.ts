import { DatePipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { ConfirmationDialogConfig } from '../../../../../../../core/src/shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../../../../core/src/shared/components/confirmation-dialog.service';
import { ITableColumn, ITableText } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import {
  defaultPaginationPageSizeOptionsTable,
  IGlobalListAction,
  IListAction,
  IListConfig,
  IMultiListAction,
  ListViewTypes,
} from '../../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import {
  TableCellRouteAppsAttachedComponent,
} from '../cf-routes/table-cell-route-apps-attached/table-cell-route-apps-attached.component';
import { TableCellRouteComponent } from '../cf-routes/table-cell-route/table-cell-route.component';
import { TableCellTCPRouteComponent } from '../cf-routes/table-cell-tcproute/table-cell-tcproute.component';
import { CfRoutesDataSourceBase, ListCfRoute } from './cf-routes-data-source-base';


export abstract class CfRoutesListConfigBase implements IListConfig<APIResource> {

  static columnIdMappedApps = 'mappedapps';
  static columnIdRoute = 'route';
  static columnIdIsTCP = 'tcproute';

  abstract getDataSource: () => CfRoutesDataSourceBase;
  getGlobalActions: () => IGlobalListAction<APIResource>[];
  getMultiActions: () => IMultiListAction<APIResource<any>>[];
  getSingleActions: () => IListAction<APIResource<ListCfRoute>>[];

  columns: Array<ITableColumn<APIResource>> = [
    {
      columnId: 'route',
      headerCell: () => 'Route',
      cellComponent: TableCellRouteComponent,
      cellFlex: '4',
    },
    {
      columnId: CfRoutesListConfigBase.columnIdMappedApps,
      headerCell: () => 'Attached Applications',
      cellComponent: TableCellRouteAppsAttachedComponent,
      cellConfig: {
        breadcrumbs: 'cf',
      },
      cellFlex: '4',
    },
    {
      columnId: CfRoutesListConfigBase.columnIdIsTCP,
      headerCell: () => 'TCP Route',
      cellComponent: TableCellTCPRouteComponent,
      cellFlex: '2',
    },
    {
      columnId: 'creation', headerCell: () => 'Creation Date',
      cellDefinition: {
        getValue: (row: APIResource) => `${this.datePipe.transform(row.metadata.created_at, 'medium')}`
      },
      sort: {
        type: 'sort',
        orderKey: 'creation',
        field: 'metadata.created_at'
      },
      cellFlex: '2'
    },
  ];
  pageSizeOptions = defaultPaginationPageSizeOptionsTable;
  viewType = ListViewTypes.TABLE_ONLY;
  text: ITableText = {
    title: null,
    noEntries: 'There are no routes',
    filter: 'Search by Route',
    maxedResults: {
      icon: 'route',
      iconFont: 'stratos-icons',
      canIgnoreMaxFirstLine: 'Fetching all routes might take a long time',
      cannotIgnoreMaxFirstLine: 'There are too many routes to fetch'
    }
  };
  enableTextFilter = true;

  private multiListActionDelete: IMultiListAction<APIResource> = {
    action: (items: APIResource[]) => {
      if (items.length === 1) {
        this.deleteSingleRoute(items[0]);
      } else {
        this.deleteMultipleRoutes(items);
      }
      return false;
    },
    icon: 'delete',
    label: 'Delete',
    description: 'Unmap and delete route',
  };

  private multiListActionUnmap: IMultiListAction<APIResource> = {
    action: (items: APIResource[]) => {
      if (items.length === 1) {
        this.unmapSingleRoute(items[0]);
      } else {
        this.unmapMultipleRoutes(items);
      }
      return false;
    },
    icon: 'block',
    label: 'Unmap',
    description: 'Unmap route',
  };

  private listActionDelete: IListAction<APIResource<ListCfRoute>> = {
    action: (item: APIResource) => this.deleteSingleRoute(item),
    label: 'Delete',
    description: 'Unmap and delete route',
    createVisible: this.canEditRoute,
  };

  private listActionUnmap: IListAction<APIResource> = {
    action: (item: APIResource) => this.unmapSingleRoute(item),
    label: 'Unmap',
    description: 'Unmap route',
    createVisible: this.canEditRoute,
    createEnabled: (row$: Observable<APIResource>) => row$.pipe(map(row => row.entity.apps && row.entity.apps.length))
  };

  private dispatchDeleteAction(route: APIResource<ListCfRoute>) {
    const appGuids = (route.entity.apps || []).map(app => app.metadata.guid);
    const singleApp = appGuids.length === 1;
    cfEntityCatalog.route.api.delete(
      route.metadata.guid,
      this.cfGuid,
      // FIXME: The appGuid/appGuids params need merging
      singleApp ? appGuids[0] : null,
      singleApp ? null : appGuids
    );
  }

  private dispatchUnmapAction(routeGuid: string, appGuids: string[]) {
    appGuids.forEach(appGuid => {
      cfEntityCatalog.route.api.unmap(
        routeGuid,
        appGuid,
        this.cfGuid,
        this.removeEntityOnUnmap ? this.getDataSource().masterAction.paginationKey : null
      );
    });
  }

  private deleteSingleRoute(item: APIResource<ListCfRoute>) {
    const confirmation = new ConfirmationDialogConfig(
      'Delete Route',
      `Are you sure you want to delete the route \n\'${item.entity.url}\'?`,
      'Delete',
      true
    );
    this.confirmDialog.open(confirmation, () => {
      this.dispatchDeleteAction(item);
      this.getDataSource().selectClear();
    });
  }

  private deleteMultipleRoutes(items: APIResource<ListCfRoute>[]) {
    const confirmation = new ConfirmationDialogConfig(
      'Delete Routes from Application',
      `Are you sure you want to delete ${items.length} routes?`,
      `Delete ${items.length}`
    );
    this.confirmDialog.open(confirmation, () => {
      items.forEach(item => this.dispatchDeleteAction(item));
      this.getDataSource().selectClear();
    });
  }

  // If the data source only caters for a single app ensure we update that app alone
  private getSingleOrMultiAppGuids = (route: APIResource<ListCfRoute>) =>
    !!this.getDataSource().appGuid ? [this.getDataSource().appGuid] : route.entity.apps.map(app => app.metadata.guid)

  private unmapSingleRoute(item: APIResource<ListCfRoute>) {
    const appText = !!this.getDataSource().appGuid ? '' : ` from ${item.entity.apps.length} application/s`;
    const confirmation = new ConfirmationDialogConfig(
      'Unmap Route',
      `Are you sure you want to unmap the route \'${item.entity.url}\'${appText}?`,
      'Unmap',
      true
    );
    this.confirmDialog.open(confirmation, () => {
      this.dispatchUnmapAction(item.metadata.guid, this.getSingleOrMultiAppGuids(item));
      this.getDataSource().selectClear();
    });
  }

  private unmapMultipleRoutes(items: APIResource<ListCfRoute>[]) {
    const appText = !!this.getDataSource().appGuid ? '' : ' from multiple applications';
    const confirmation = new ConfirmationDialogConfig(
      'Unmap Routes',
      `Are you sure you want to unmap ${items.length} routes${appText}?`,
      `Unmap ${items.length}`,
      true
    );
    this.confirmDialog.open(confirmation, () => {
      items.forEach(item => this.dispatchUnmapAction(item.metadata.guid, this.getSingleOrMultiAppGuids(item)));
      this.getDataSource().selectClear();
    });
  }

  getColumns = () => this.columns;
  getMultiFiltersConfigs = () => [];

  /**
   * Creates an instance of CfRoutesListConfigBase.
   * @param isLocal Is the list all local or paginated via the cf api
   * @param [hasActions=true] Should actions such as unmap and delete be shown
   * @param [canEditRoute] User can edit route?
   * @param [canEditSpace$] User can edit space?
   * @param [removeEntityOnUnmap=false] On unmap remove the entity from the list
   */
  constructor(
    private store: Store<CFAppState>,
    private confirmDialog: ConfirmationDialogService,
    private cfGuid: string,
    private datePipe: DatePipe,
    public isLocal: boolean,
    hasActions = true,
    private canEditRoute?: (route: Observable<APIResource<ListCfRoute>>) => Observable<boolean>,
    canEditSpace$?: Observable<boolean>,
    private removeEntityOnUnmap = false
  ) {

    if (this.isLocal) {
      this.columns.find(column => column.columnId === CfRoutesListConfigBase.columnIdRoute).sort = {
        type: 'sort',
        orderKey: CfRoutesListConfigBase.columnIdRoute,
        field: 'entity.url'
      };
      this.columns.find(column => column.columnId === CfRoutesListConfigBase.columnIdIsTCP).sort = {
        type: 'sort',
        orderKey: CfRoutesListConfigBase.columnIdIsTCP,
        field: 'entity.isTCPRoute'
      };
    }

    if (hasActions) {
      this.multiListActionDelete.visible$ = canEditSpace$;
      this.multiListActionUnmap.visible$ = canEditSpace$;
    }

    this.getGlobalActions = () => [];
    this.getMultiActions = () => hasActions ? [this.multiListActionUnmap, this.multiListActionDelete] : [];
    this.getSingleActions = () => hasActions ? [this.listActionDelete, this.listActionUnmap] : [];
  }

}
