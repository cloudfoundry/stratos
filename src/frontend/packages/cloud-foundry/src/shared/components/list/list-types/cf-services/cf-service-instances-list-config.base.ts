import { DatePipe } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import {
  CurrentUserPermissionsService,
  defaultPaginationPageSizeOptionsTable,
  IGlobalListAction,
  IListAction,
  IListConfig,
  IListMultiFilterConfig,
  IMultiListAction,
  ITableColumn,
  ITableText,
  ListDataSource,
  ListViewTypes
} from '@stratosui/core';
import { APIResource, ListView, MultiActionListEntity } from '@stratosui/store';
import { CFAppState } from '../../../../../cf-app-state';
import { IServiceInstance } from '../../../../../cf-api-svc.types';
import { isUserProvidedServiceInstance } from '../../../../../features/cf/cf.helpers';
import { CfCurrentUserPermissions } from '../../../../../user-permissions/cf-user-permissions-checkers';
import { ServiceActionHelperService } from '../../../../data-services/service-action-helper.service';
import { CANCEL_ORG_ID_PARAM, CANCEL_SPACE_ID_PARAM, CSI_CANCEL_URL } from '../../../add-service-instance/csi-mode.service';
import {
  TableCellAppCfOrgSpaceHeaderComponent,
} from '../app/table-cell-app-cforgspace-header/table-cell-app-cforgspace-header.component';
import { TableCellAppCfOrgSpaceComponent } from '../app/table-cell-app-cforgspace/table-cell-app-cforgspace.component';
import {
  TableCellServiceInstanceAppsAttachedComponent,
} from '../cf-spaces-service-instances/table-cell-service-instance-apps-attached/table-cell-service-instance-apps-attached.component';
import {
  TableCellServiceInstanceTagsComponent,
} from '../cf-spaces-service-instances/table-cell-service-instance-tags/table-cell-service-instance-tags.component';
import {
  TableCellServiceLastOpComponent,
} from '../cf-spaces-service-instances/table-cell-service-last-op/table-cell-service-last-op.component';
import { TableCellServiceComponent } from '../cf-spaces-service-instances/table-cell-service/table-cell-service.component';

interface CanCache {
  [spaceGuid: string]: Observable<boolean>;
}

@Injectable()
export class CfServiceInstancesListConfigBase implements IListConfig<APIResource<IServiceInstance>> {
  viewType = ListViewTypes.TABLE_ONLY;
  pageSizeOptions = defaultPaginationPageSizeOptionsTable;
  dataSource!: ListDataSource<APIResource>;
  defaultView = 'table' as ListView;
  text: ITableText = {
    title: null,
    filter: null,
    noEntries: 'There are no service instances'
  };

  private canDetachCache: CanCache = {};
  private canDeleteCache: CanCache = {};

  protected serviceInstanceColumns: ITableColumn<APIResource<IServiceInstance>>[] = [
    {
      columnId: 'name',
      headerCell: () => 'Name',
      cellDefinition: {
        getValue: (row) => {
          const entity = MultiActionListEntity.getEntity(row);
          return `${entity.entity.name}`;
        }
      },
      sort: {
        type: 'natural-sort',
        orderKey: 'name',
        field: 'entity.name'
      },
      cellFlex: '2'
    },
    {
      columnId: 'space',
      headerCellComponent: TableCellAppCfOrgSpaceHeaderComponent,
      cellComponent: TableCellAppCfOrgSpaceComponent,
      cellFlex: '2'
    },
    {
      columnId: 'service',
      headerCell: () => 'Service',
      cellComponent: TableCellServiceComponent,
      cellFlex: '3'
    },
    {
      columnId: 'lastOp',
      headerCell: () => 'Last Operation',
      cellComponent: TableCellServiceLastOpComponent,
      cellFlex: '2'
    },
    {
      columnId: 'dashboard',
      headerCell: () => 'Dashboard',
      cellDefinition: {
        externalLink: true,
        getLink: (row: APIResource<IServiceInstance>) => {
          const entity = MultiActionListEntity.getEntity(row);
          return entity.entity.dashboard_url;
        },
        newTab: true,
        showShortLink: true
      },
      cellFlex: '1'
    },
    {
      columnId: 'tags',
      headerCell: () => 'Tags',
      cellComponent: TableCellServiceInstanceTagsComponent,
      cellFlex: '2'
    },
    {
      columnId: 'attachedApps',
      headerCell: () => 'Attached Applications',
      cellComponent: TableCellServiceInstanceAppsAttachedComponent,
      cellFlex: '3'
    },
    {
      columnId: 'creation', headerCell: () => 'Creation Date',
      cellDefinition: {
        getValue: (row: APIResource) => {
          const entity = MultiActionListEntity.getEntity(row);
          return `${this.datePipe.transform(entity.metadata.created_at, 'medium')}`;
        }
      },
      sort: {
        type: 'sort',
        orderKey: 'creation',
        field: 'metadata.created_at'
      },
      cellFlex: '1'
    },
  ];

  private listActionDelete: IListAction<APIResource<IServiceInstance>> = {
    action: (item: APIResource<IServiceInstance>) => this.deleteServiceInstance(item),
    label: 'Delete',
    description: 'Delete Service Instance',
    createVisible: (row$: Observable<APIResource<IServiceInstance>>) =>
      row$.pipe(
        switchMap(
          row => row && row.entity && row.entity.cfGuid && row.entity.space_guid ?
            this.can(this.canDeleteCache, CfCurrentUserPermissions.SERVICE_INSTANCE_DELETE, row.entity.cfGuid, row.entity.space_guid) :
            observableOf(false)
        )
      )
  };

  private listActionDetach: IListAction<APIResource<IServiceInstance>> = {
    action: (item: APIResource<IServiceInstance>) => this.deleteServiceBinding(item),
    label: 'Unbind',
    description: 'Unbind Service Instance',
    createEnabled: (row$: Observable<APIResource<IServiceInstance>>) => row$.pipe(
      map(row => !!(row && row.entity && row.entity.service_bindings && row.entity.service_bindings.length !== 0))
    ),
    createVisible: (row$: Observable<APIResource<IServiceInstance>>) =>
      row$.pipe(
        switchMap(
          row => row && row.entity && row.entity.cfGuid && row.entity.space_guid ?
            this.can(this.canDetachCache, CfCurrentUserPermissions.SERVICE_BINDING_EDIT, row.entity.cfGuid, row.entity.space_guid) :
            observableOf(false)
        )
      )
  };

  private listActionEdit: IListAction<APIResource> = {
    action: (item: APIResource<IServiceInstance>) =>
      this.serviceActionHelperService.startEditServiceBindingStepper(
        item.metadata.guid,
        item.entity.cfGuid,
        {
          [CANCEL_SPACE_ID_PARAM]: item.entity.space_guid,
          [CANCEL_ORG_ID_PARAM]: item.entity.space.entity.organization_guid,
          [CSI_CANCEL_URL]: this.rootLocation
        },
        !!isUserProvidedServiceInstance(item.entity)),
    label: 'Edit',
    description: 'Edit Service Instance',
    createVisible: (row$: Observable<APIResource<IServiceInstance>>) =>
      row$.pipe(
        switchMap(
          row => row && row.entity && row.entity.cfGuid && row.entity.space_guid ?
            this.can(this.canDetachCache, CfCurrentUserPermissions.SERVICE_BINDING_EDIT, row.entity.cfGuid, row.entity.space_guid) :
            observableOf(false)
        )
      )
  };

  private can(cache: CanCache, perm: CfCurrentUserPermissions, cfGuid: string, spaceGuid: string): Observable<boolean> {
    let can = cache[spaceGuid];
    if (!can) {
      can = this.currentUserPermissionsService.can(perm, cfGuid, spaceGuid);
      cache[spaceGuid] = can;
    }
    return can;
  }

  protected store = inject<Store<CFAppState>>(Store);
  protected datePipe = inject(DatePipe);
  protected currentUserPermissionsService = inject(CurrentUserPermissionsService);
  private serviceActionHelperService = inject(ServiceActionHelperService);

  // eslint-disable-next-line @angular-eslint/prefer-inject -- rootLocation is a plain string passed by subclasses, not injectable
  constructor(
    private rootLocation: string
  ) {
  }

  deleteServiceInstance = (serviceInstance: APIResource<IServiceInstance>) =>
    this.serviceActionHelperService.deleteServiceInstance(
      serviceInstance.metadata.guid,
      serviceInstance.entity.name,
      serviceInstance.entity.cfGuid
    )


  deleteServiceBinding = (serviceInstance: APIResource<IServiceInstance>) => {
    this.serviceActionHelperService.detachServiceBinding(
      serviceInstance.entity.service_bindings,
      serviceInstance.metadata.guid,
      serviceInstance.entity.cfGuid
    );
  }

  getGlobalActions = (): IGlobalListAction<APIResource<IServiceInstance>>[] => [];
  getMultiActions = (): IMultiListAction<APIResource<IServiceInstance>>[] => [];
  getSingleActions = (): IListAction<APIResource<IServiceInstance>>[] => [this.listActionEdit, this.listActionDetach, this.listActionDelete];
  getMultiFiltersConfigs = (): IListMultiFilterConfig[] => [];
  getColumns = (): ITableColumn<APIResource<IServiceInstance>>[] => this.serviceInstanceColumns;
  getDataSource = (): ListDataSource<APIResource> | null => null;

}
