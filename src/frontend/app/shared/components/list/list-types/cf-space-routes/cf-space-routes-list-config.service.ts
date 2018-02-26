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
import { ConfirmationDialogService } from '../../../confirmation-dialog.service';
import { ITableColumn } from '../../list-table/table.types';
import { IGlobalListAction, IListAction, IListConfig, IMultiListAction, ListViewTypes } from '../../list.component.types';
import { CfSpaceRoutesDataSource } from './cf-space-routes-data-source';
import { TableCellRouteComponent } from '../app-route/table-cell-route/table-cell-route.component';
import { TableCellRouteAppsAttachedComponent } from './table-cell-route-apps-attached/table-cell-route-apps-attached.component';
import { CloudFoundrySpaceService } from '../../../../../features/cloud-foundry/services/cloud-foundry-space.service';
import { ConfirmationDialogConfig } from '../../../confirmation-dialog.config';
@Injectable()
export class CfSpaceRoutesListConfigService implements IListConfig<APIResource> {
  dataSource: CfSpaceRoutesDataSource;

  private multiListActionDelete: IMultiListAction<APIResource> = {
    action: (items: APIResource[]) => {
      if (items.length === 1) {
        this.deleteSingleRoute(items[0]);
      } else {
        const confirmation = new ConfirmationDialogConfig(
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
        const confirmation = new ConfirmationDialogConfig(
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
      columnId: 'mappedapps',
      headerCell: () => 'Application Attached',
      cellComponent: TableCellRouteAppsAttachedComponent,
      cellFlex: '4',
    }
  ];

  pageSizeOptions = [5, 15, 30];
  viewType = ListViewTypes.TABLE_ONLY;
  isLocal = true;

  dispatchDeleteAction(route) {
    return this.store.dispatch(
      new DeleteRoute(route.entity.guid, this.dataSource.cfGuid)
    );
  }

  dispatchUnmapAction(route) {
    this.dataSource.getAttachedAppGuids(route).forEach(
      p => this.store.dispatch(
        new UnmapRoute(
          route.entity.guid,
          p,
          this.dataSource.cfGuid
        )
      )
    );
  }

  getGlobalActions = () => [];
  getMultiActions() {
    return [this.multiListActionUnmap, this.multiListActionDelete];
  }

  getSingleActions = () => [this.listActionDelete, this.listActionUnmap];
  getColumns = () => this.columns;
  getDataSource = () => this.dataSource;
  getMultiFiltersConfigs = () => [];

  constructor(
    private store: Store<AppState>,
    private confirmDialog: ConfirmationDialogService,
    private cfSpaceService: CloudFoundrySpaceService
  ) {
    this.dataSource = new CfSpaceRoutesDataSource(
      this.store,
      this,
      this.cfSpaceService.spaceGuid,
      this.cfSpaceService.cfGuid
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
          const confirmation = new ConfirmationDialogConfig(
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
