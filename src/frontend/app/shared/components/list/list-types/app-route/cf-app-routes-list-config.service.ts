import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { take, tap } from 'rxjs/operators';

import { ApplicationService } from '../../../../../features/applications/application.service';
import { getRoute } from '../../../../../features/applications/routes/routes.helper';
import { GetAppRoutes } from '../../../../../store/actions/application-service-routes.actions';
import { DeleteRoute, UnmapRoute } from '../../../../../store/actions/route.actions';
import { RouterNav } from '../../../../../store/actions/router.actions';
import { AppState } from '../../../../../store/app-state';
import { selectEntity } from '../../../../../store/selectors/api.selectors';
import { APIResource, EntityInfo } from '../../../../../store/types/api.types';
import { ConfirmationDialogConfig } from '../../../confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../confirmation-dialog.service';
import { ITableColumn } from '../../list-table/table.types';
import { IGlobalListAction, IListAction, IMultiListAction, ListConfig, ListViewTypes } from '../../list.component.types';
import { CfAppRoutesDataSource } from './cf-app-routes-data-source';
import { TableCellRouteComponent } from './table-cell-route/table-cell-route.component';
import { TableCellTCPRouteComponent } from './table-cell-tcproute/table-cell-tcproute.component';

@Injectable()
export class CfAppRoutesListConfigService extends ListConfig<APIResource> {

  routesDataSource: CfAppRoutesDataSource;
  public multiListActionDelete: IMultiListAction<APIResource> = {
    action: (items: APIResource[]) => {
      if (items.length === 1) {
        this.deleteSingleRoute(items[0]);
      } else {
        const confirmation = new ConfirmationDialogConfig(
          'Delete Routes from Application',
          `Are you sure you want to delete ${items.length} routes?`,
          `Delete ${items.length}`,
          true
        );
        this.confirmDialog.open(confirmation, () => {
          items.forEach(item => this.dispatchDeleteAction(item));
          this.getDataSource().selectClear();
        });
      }
      return false;
    },
    icon: 'delete',
    label: 'Delete',
    description: 'Unmap and delete routes'
  };

  private multiListActionUnmap: IMultiListAction<APIResource> = {
    action: (items: APIResource[]) => {
      if (items.length === 1) {
        this.unmapSingleRoute(items[0]);
      } else {
        const confirmation = new ConfirmationDialogConfig(
          'Unmap Routes from Application',
          `Are you sure you want to unmap ${items.length} routes?`,
          'Unmap All',
          true
        );
        this.confirmDialog.open(confirmation, () => {
          items.forEach(item => this.dispatchUnmapAction(item));
          this.getDataSource().selectClear();
        });
      }
      return false;
    },
    icon: 'block',
    label: 'Unmap',
    description: 'Unmap routes'
  };

  private listActionDelete: IListAction<APIResource> = {
    action: (item: APIResource) => this.deleteSingleRoute(item),
    label: 'Delete',
    description: 'Unmap and delete route'
  };

  private listActionUnmap: IListAction<APIResource> = {
    action: (item: APIResource) => this.unmapSingleRoute(item),
    label: 'Unmap',
    description: ''
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
    description: 'Add new route'
  };

  columns: Array<ITableColumn<APIResource>> = [
    {
      columnId: 'route',
      headerCell: () => 'Route',
      cellComponent: TableCellRouteComponent,
      cellFlex: '10',
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
      cellFlex: '6',
      sort: {
        type: 'sort',
        orderKey: 'tcproute',
        field: 'entity.isTCPRoute'
      },
    }
  ];

  viewType = ListViewTypes.TABLE_ONLY;
  text = {
    title: null,
    noEntries: 'There are no routes'
  };
  isLocal = true;

  dispatchDeleteAction(route) {
    return this.store.dispatch(
      new DeleteRoute(route.metadata.guid, this.routesDataSource.cfGuid, this.appService.appGuid)
    );
  }

  dispatchUnmapAction(route) {
    return this.store.dispatch(
      new UnmapRoute(
        route.metadata.guid,
        this.routesDataSource.appGuid,
        this.routesDataSource.cfGuid
      )
    );
  }

  getGlobalActions = () => [this.listActionAdd];
  getMultiActions = () => {
    return [this.multiListActionUnmap, this.multiListActionDelete];
  }

  getSingleActions = () => [this.listActionDelete, this.listActionUnmap];
  getColumns = () => this.columns;
  getDataSource = () => this.routesDataSource;
  getMultiFiltersConfigs = () => [];

  constructor(
    private store: Store<AppState>,
    private appService: ApplicationService,
    private confirmDialog: ConfirmationDialogService,
    getRoutesAction: GetAppRoutes = null
  ) {
    super();

    this.routesDataSource = new CfAppRoutesDataSource(
      this.store,
      this.appService,
      getRoutesAction || new GetAppRoutes(appService.appGuid, appService.cfGuid),
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
          const confirmation = new ConfirmationDialogConfig(
            'Delete Route',
            `Are you sure you want to delete the route \n\'${routeUrl}\'?`,
            'Delete',
            true
          );
          this.confirmDialog.open(confirmation, () => {
            this.dispatchDeleteAction(item);
            this.getDataSource().selectClear();
          });
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
          const confirmation = new ConfirmationDialogConfig(
            'Unmap Route from Application',
            `Are you sure you want to unmap the route \'${routeUrl}\'?`,
            'Unmap',
            true
          );
          this.confirmDialog.open(confirmation, () => {
            this.dispatchUnmapAction(item);
            this.getDataSource().selectClear();
          });
        })
      )
      .subscribe();
  }
}
