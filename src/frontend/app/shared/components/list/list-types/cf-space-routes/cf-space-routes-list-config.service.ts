
import { of as observableOf, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { take, tap, map } from 'rxjs/operators';

import { getRoute } from '../../../../../features/applications/routes/routes.helper';
import { CloudFoundrySpaceService } from '../../../../../features/cloud-foundry/services/cloud-foundry-space.service';
import { DeleteRoute, UnmapRoute } from '../../../../../store/actions/route.actions';
import { AppState } from '../../../../../store/app-state';
import { selectEntity } from '../../../../../store/selectors/api.selectors';
import { APIResource, EntityInfo } from '../../../../../store/types/api.types';
import { ConfirmationDialogConfig } from '../../../confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../confirmation-dialog.service';
import { ITableColumn } from '../../list-table/table.types';
import { IListAction, IListConfig, IMultiListAction, ListViewTypes } from '../../list.component.types';
import { TableCellRouteComponent } from '../app-route/table-cell-route/table-cell-route.component';
import { CfSpaceRoutesDataSource } from './cf-space-routes-data-source';
import {
  TableCellRouteAppsAttachedComponent,
} from './table-cell-route-apps-attached/table-cell-route-apps-attached.component';
import { DatePipe } from '@angular/common';
import { CurrentUserPermissionsService } from '../../../../../core/current-user-permissions.service';
import { CurrentUserPermissions } from '../../../../../core/current-user-permissions.config';

@Injectable()
export class CfSpaceRoutesListConfigService implements IListConfig<APIResource> {
  private dataSource: CfSpaceRoutesDataSource;
  private canEditApp$: Observable<boolean>;

  private multiListActionDelete: IMultiListAction<APIResource> = {
    action: (items: APIResource[]) => {
      if (items.length === 1) {
        this.deleteSingleRoute(items[0]);
      } else {
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
        const confirmation = new ConfirmationDialogConfig(
          'Unmap Routes from Application',
          `Are you sure you want to unmap ${items.length} routes?`,
          `Unmap ${items.length}`,
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
    description: 'Unmap route',
  };

  private listActionDelete: IListAction<APIResource> = {
    action: (item: APIResource) => this.deleteSingleRoute(item),
    label: 'Delete',
    description: 'Unmap and delete route',
    createVisible: () => this.canEditApp$,
  };

  private listActionUnmap: IListAction<APIResource> = {
    action: (item: APIResource) => this.unmapSingleRoute(item),
    label: 'Unmap',
    description: 'Unmap route',
    createVisible: () => this.canEditApp$,
    createEnabled: (row$: Observable<APIResource>) => row$.pipe(map(row => row.entity.apps && row.entity.apps.length))
  };

  columns: Array<ITableColumn<APIResource>> = [
    {
      columnId: 'route',
      headerCell: () => 'Route',
      cellComponent: TableCellRouteComponent,
      cellFlex: '4',
    },
    {
      columnId: 'mappedapps',
      headerCell: () => 'Application Attached',
      cellComponent: TableCellRouteAppsAttachedComponent,
      cellFlex: '4',
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

  pageSizeOptions = [5, 15, 30];
  viewType = ListViewTypes.TABLE_ONLY;
  // This would normally be fetched inline, however some of the route's children will be missing if the route was fetched by the org request
  // This can lead to a new request per row and can grind the console to a halt
  isLocal = false;
  text = {
    title: null,
    noEntries: 'There are no routes'
  };

  dispatchDeleteAction(route) {
    const appGuids = route.entity.apps.map(a => a.metadata.guid);
    return this.store.dispatch(
      new DeleteRoute(route.metadata.guid, this.dataSource.cfGuid, null, appGuids)
    );
  }

  dispatchUnmapAction(route) {
    return route.entity.apps.map(a => a.metadata.guid).forEach(
      p => this.store.dispatch(
        new UnmapRoute(
          route.metadata.guid,
          p,
          this.dataSource.cfGuid,
          false// We don't want to just remove the entity, we want to clear entities of this type forcing all to refresh
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
    private cfSpaceService: CloudFoundrySpaceService,
    private datePipe: DatePipe,
    public currentUserPermissionsService: CurrentUserPermissionsService
  ) {
    this.dataSource = new CfSpaceRoutesDataSource(
      this.store,
      this,
      this.cfSpaceService.spaceGuid,
      this.cfSpaceService.cfGuid,
    );
    this.canEditApp$ = this.currentUserPermissionsService.can(
      CurrentUserPermissions.APPLICATION_EDIT,
      this.cfSpaceService.cfGuid,
      this.cfSpaceService.spaceGuid
    );
    this.multiListActionDelete.visible$ = this.canEditApp$;
    this.multiListActionUnmap.visible$ = this.canEditApp$;
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
