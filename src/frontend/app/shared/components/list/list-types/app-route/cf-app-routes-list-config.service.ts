import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { take, tap } from 'rxjs/operators';

import { ApplicationService } from '../../../../../features/applications/application.service';
import { getRoute } from '../../../../../features/applications/routes/routes.helper';
import { getPaginationKey } from '../../../../../store/actions/pagination.actions';
import { DeleteRoute, GetAppRoutes, UnmapRoute } from '../../../../../store/actions/route.actions';
import { RouterNav } from '../../../../../store/actions/router.actions';
import { AppState } from '../../../../../store/app-state';
import { selectEntity } from '../../../../../store/selectors/api.selectors';
import { APIResource, EntityInfo } from '../../../../../store/types/api.types';
import { ConfirmationDialog, ConfirmationDialogService } from '../../../confirmation-dialog.service';
import { ITableColumn } from '../../list-table/table.types';
import { IGlobalListAction, IListAction, IListConfig, IMultiListAction, ListViewTypes } from '../../list.component.types';
import { CfAppRoutesDataSource } from './cf-app-routes-data-source';
import { TableCellRouteComponent } from './table-cell-route/table-cell-route.component';
import { TableCellTCPRouteComponent } from './table-cell-tcproute/table-cell-tcproute.component';

@Injectable()
export class CfAppRoutesListConfigService implements IListConfig<APIResource> {
  routesDataSource: CfAppRoutesDataSource;

  private multiListActionDelete: IMultiListAction<APIResource> = {
    action: (items: APIResource[]) => {
      if (items.length === 1) {
        this.deleteSingleRoute(items[0]);
      } else {
        const confirmation = new ConfirmationDialog(
          'Delete Routes from Application',
          `Are you sure you want to delete ${items.length} routes?`,
          'Delete All'
        );
        this.confirmDialog.open(confirmation, () =>
          items.forEach(item => this.dispatchDeleteAction(item))
        );
      }
    },
    icon: 'delete',
    label: 'Delete',
    description: 'Unmap and delete route',
    visible: (row: APIResource) => true,
    enabled: (row: APIResource) => true
  };

  private multiListActionUnmap: IMultiListAction<APIResource> = {
    action: (items: APIResource[]) => {
      if (items.length === 1) {
        this.unmapSingleRoute(items[0]);
      } else {
        const confirmation = new ConfirmationDialog(
          'Unmap Routes from Application',
          `Are you sure you want to unmap ${items.length} routes?`,
          'Unmap All'
        );
        this.confirmDialog.open(confirmation, () =>
          items.forEach(item => this.dispatchUnmapAction(item))
        );
      }
    },
    icon: 'block',
    label: 'Unmap',
    description: 'Unmap route',
    visible: (row: APIResource) => true,
    enabled: (row: APIResource) => true
  };

  private listActionDelete: IListAction<APIResource> = {
    action: (item: APIResource) => this.deleteSingleRoute(item),
    icon: 'delete',
    label: 'Delete',
    description: 'Unmap and delete route',
    visible: (row: APIResource) => true,
    enabled: (row: APIResource) => true
  };

  private listActionUnmap: IListAction<APIResource> = {
    action: (item: APIResource) => this.unmapSingleRoute(item),
    icon: 'block',
    label: 'Unmap',
    description: 'Unmap route',
    visible: (row: APIResource) => true,
    enabled: (row: APIResource) => true
  };

  private listActionAdd: IGlobalListAction<APIResource> = {
    action: () => {
      this.appService.application$
        .pipe(
        take(1),
        tap(app => {
          this.store.dispatch(
            new RouterNav({
              path: [
                'applications',
                this.appService.cfGuid,
                this.appService.appGuid,
                'add-route'
              ],
              query: {
                spaceGuid: app.app.entity.space_guid
              }
            })
          );
        })
        )
        .subscribe();
    },
    icon: 'add',
    label: 'Add',
    description: 'Add new route',
    visible: (row: APIResource) => true,
    enabled: (row: APIResource) => true
  };

  columns: Array<ITableColumn<APIResource>> = [
    {
      columnId: 'route',
      headerCell: () => 'Route',
      cellComponent: TableCellRouteComponent,
      cellFlex: '4',
      sort: {
        type: 'sort',
        orderKey: 'route',
        field: 'entity.host'
      }
    },
    {
      columnId: 'tcproute',
      headerCell: () => 'TCP Route',
      cellComponent: TableCellTCPRouteComponent,
      cellFlex: '4',
      sort: {
        type: 'sort',
        orderKey: 'tcproute',
        field: 'entity.isTCPRoute'
      },
    }
  ];

  pageSizeOptions = [5, 15, 30];
  viewType = ListViewTypes.TABLE_ONLY;
  text = {
    title: 'Routes'
  };
  isLocal = true;

  dispatchDeleteAction(route) {
    return this.store.dispatch(
      new DeleteRoute(route.entity.guid, this.routesDataSource.cfGuid)
    );
  }

  dispatchUnmapAction(route) {
    return this.store.dispatch(
      new UnmapRoute(
        route.entity.guid,
        this.routesDataSource.appGuid,
        this.routesDataSource.cfGuid
      )
    );
  }

  getGlobalActions = () => [this.listActionAdd];
  getMultiActions() {
    return [this.multiListActionUnmap, this.multiListActionDelete];
  }

  getSingleActions = () => [this.listActionDelete, this.listActionUnmap];
  getColumns = () => this.columns;
  getDataSource = () => this.routesDataSource;
  getMultiFiltersConfigs = () => [];

  constructor(
    private store: Store<AppState>,
    private appService: ApplicationService,
    private confirmDialog: ConfirmationDialogService
  ) {
    this.routesDataSource = new CfAppRoutesDataSource(
      this.store,
      this.appService,
      new GetAppRoutes(appService.appGuid, appService.cfGuid),
      getPaginationKey('route', appService.cfGuid, appService.appGuid),
      false,
      this
    );
  }

  private deleteSingleRoute(item: APIResource) {
    this.store
      .select(selectEntity<EntityInfo>('domain', item.entity.domain_guid))
      .pipe(
      take(1),
      tap(domain => {
        const routeUrl = getRoute(item, false, false, domain);
        const confirmation = new ConfirmationDialog(
          'Delete Route',
          `Are you sure you want to delete the route \'${routeUrl}\'?`,
          'Delete'
        );
        this.confirmDialog.open(confirmation, () =>
          this.dispatchDeleteAction(item)
        );
      })
      )
      .subscribe();
  }

  private unmapSingleRoute(item: APIResource) {
    this.store
      .select(selectEntity<EntityInfo>('domain', item.entity.domain_guid))
      .pipe(
      take(1),
      tap(domain => {
        const routeUrl = getRoute(item, false, false, domain);
        const confirmation = new ConfirmationDialog(
          'Unmap Route from Application',
          `Are you sure you want to unmap the route \'${routeUrl}\'?`,
          'Unmap'
        );
        this.confirmDialog.open(confirmation, () =>
          this.dispatchUnmapAction(item)
        );
      })
      )
      .subscribe();
  }
}
