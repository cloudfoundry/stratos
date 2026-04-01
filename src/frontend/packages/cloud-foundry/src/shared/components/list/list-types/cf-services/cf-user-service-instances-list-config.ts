import { DatePipe } from '@angular/common';
import { Injectable, inject } from '@angular/core';
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
import { APIResource, ListView } from '@stratosui/store';
import { CFAppState } from '../../../../../cf-app-state';
import { IUserProvidedServiceInstance } from '../../../../../cf-api-svc.types';
import { CloudFoundrySpaceService } from '../../../../../features/cf/services/cloud-foundry-space.service';
import { CfCurrentUserPermissions } from '../../../../../user-permissions/cf-user-permissions-checkers';
import { ServiceActionHelperService } from '../../../../data-services/service-action-helper.service';
import {
  CANCEL_ORG_ID_PARAM,
  CANCEL_SPACE_ID_PARAM,
  CANCEL_USER_PROVIDED,
  CSI_CANCEL_URL,
} from '../../../add-service-instance/csi-mode.service';
import {
  CfSpacesUserServiceInstancesDataSource,
} from '../cf-spaces-service-instances/cf-spaces-user-service-instances-data-source';
import {
  TableCellServiceInstanceAppsAttachedComponent,
} from '../cf-spaces-service-instances/table-cell-service-instance-apps-attached/table-cell-service-instance-apps-attached.component';
import {
  TableCellServiceInstanceTagsComponent,
} from '../cf-spaces-service-instances/table-cell-service-instance-tags/table-cell-service-instance-tags.component';
import {
  TableCellSpaceNameComponent,
} from '../cf-spaces-service-instances/table-cell-space-name/table-cell-space-name.component';

interface CanCache {
  [spaceGuid: string]: Observable<boolean>;
}

@Injectable()
export class CfUserServiceInstancesListConfigBase implements IListConfig<APIResource<IUserProvidedServiceInstance>> {
  protected store = inject<Store<CFAppState>>(Store);
  private cfSpaceService = inject(CloudFoundrySpaceService);
  protected datePipe = inject(DatePipe);
  protected currentUserPermissionsService = inject(CurrentUserPermissionsService);
  private serviceActionHelperService = inject(ServiceActionHelperService);

  viewType = ListViewTypes.TABLE_ONLY;
  pageSizeOptions = defaultPaginationPageSizeOptionsTable;
  dataSource: ListDataSource<APIResource<IUserProvidedServiceInstance>>;
  defaultView = 'table' as ListView;
  text: ITableText = {
    title: null as string | null,
    filter: null as string | null,
    noEntries: 'There are no user provided service instances'
  };

  private canDetachCache: CanCache = {};
  private canDeleteCache: CanCache = {};

  protected serviceInstanceColumns: ITableColumn<APIResource<IUserProvidedServiceInstance>>[] = [
    {
      columnId: 'name',
      headerCell: () => 'Name',
      cellDefinition: {
        getValue: (row) => `${row.entity.name}`
      },
      cellFlex: '2'
    },
    {
      columnId: 'space',
      headerCell: () => 'Space',
      cellComponent: TableCellSpaceNameComponent,
      cellFlex: '1'
    },
    {
      columnId: 'route',
      headerCell: () => 'Route Service URL',
      cellDefinition: {
        getValue: (row) => `${row.entity.route_service_url}`
      },
      cellFlex: '2'
    },
    {
      columnId: 'syslog',
      headerCell: () => 'Syslog Drain URL',
      cellDefinition: {
        getValue: (row) => `${row.entity.syslog_drain_url}`
      },
      cellFlex: '2'
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

  private listActionDelete: IListAction<APIResource<IUserProvidedServiceInstance>> = {
    action: (item: APIResource<IUserProvidedServiceInstance>) => this.deleteServiceInstance(item),
    label: 'Delete',
    description: 'Delete Service Instance',
    createVisible: (row$: Observable<APIResource<IUserProvidedServiceInstance>>) =>
      row$.pipe(
        switchMap(
          row => row && row.entity && row.entity.cfGuid && row.entity.space_guid ?
            this.can(this.canDeleteCache, CfCurrentUserPermissions.SERVICE_INSTANCE_DELETE, row.entity.cfGuid, row.entity.space_guid) :
            observableOf(false)
        )
      )
  };

  private listActionDetach: IListAction<APIResource<IUserProvidedServiceInstance>> = {
    action: (item: APIResource<IUserProvidedServiceInstance>) => this.deleteServiceBinding(item),
    label: 'Unbind',
    description: 'Unbind Service Instance',
    createEnabled: (row$: Observable<APIResource<IUserProvidedServiceInstance>>) =>
      row$.pipe(map(row => !!(row && row.entity && row.entity.service_bindings && row.entity.service_bindings.length !== 0))),
    createVisible: (row$: Observable<APIResource<IUserProvidedServiceInstance>>) =>
      row$.pipe(
        switchMap(
          row => row && row.entity && row.entity.cfGuid && row.entity.space_guid ?
            this.can(this.canDetachCache, CfCurrentUserPermissions.SERVICE_BINDING_EDIT, row.entity.cfGuid, row.entity.space_guid) :
            observableOf(false)
        )
      )
  };

  private listActionEdit: IListAction<APIResource<IUserProvidedServiceInstance>> = {
    action: (item: APIResource<IUserProvidedServiceInstance>) =>
      this.serviceActionHelperService.startEditServiceBindingStepper(
        item.metadata.guid,
        item.entity.cfGuid,
        {
          [CANCEL_SPACE_ID_PARAM]: item.entity.space_guid,
          [CANCEL_ORG_ID_PARAM]: item.entity.space.entity.organization_guid,
          [CANCEL_USER_PROVIDED]: true,
          [CSI_CANCEL_URL]: `/cloud-foundry/${this.cfSpaceService.cfGuid}/organizations/${this.cfSpaceService.orgGuid}/spaces/${this.cfSpaceService.spaceGuid}/service-instances`
        },
        true),
    label: 'Edit',
    description: 'Edit Service Instance',
    createVisible: (row$: Observable<APIResource<IUserProvidedServiceInstance>>) =>
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

  constructor() {
    const cfSpaceService = this.cfSpaceService;

    this.dataSource = new CfSpacesUserServiceInstancesDataSource(cfSpaceService.cfGuid, cfSpaceService.spaceGuid, this.store, this);
    this.serviceInstanceColumns.find(column => column.columnId === 'attachedApps').cellConfig = {
      breadcrumbs: 'space-user-services'
    };
  }

  deleteServiceInstance = (serviceInstance: APIResource<IUserProvidedServiceInstance>) =>
    this.serviceActionHelperService.deleteServiceInstance(
      serviceInstance.metadata.guid,
      serviceInstance.entity.name,
      serviceInstance.entity.cfGuid,
      true
    )


  deleteServiceBinding = (serviceInstance: APIResource<IUserProvidedServiceInstance>) => {
    this.serviceActionHelperService.detachServiceBinding(
      serviceInstance.entity.service_bindings,
      serviceInstance.metadata.guid,
      serviceInstance.entity.cfGuid,
      false,
      true
    );
  }

  getGlobalActions = (): IGlobalListAction<APIResource<IUserProvidedServiceInstance>>[] => [];
  getMultiActions = (): IMultiListAction<APIResource<IUserProvidedServiceInstance>>[] => [];
  getSingleActions = (): IListAction<APIResource<IUserProvidedServiceInstance>>[] => [this.listActionEdit, this.listActionDetach, this.listActionDelete];
  getMultiFiltersConfigs = (): IListMultiFilterConfig[] => [];
  getColumns = (): ITableColumn<APIResource<IUserProvidedServiceInstance>>[] => this.serviceInstanceColumns;
  getDataSource = (): ListDataSource<APIResource<IUserProvidedServiceInstance>> => this.dataSource;

}
