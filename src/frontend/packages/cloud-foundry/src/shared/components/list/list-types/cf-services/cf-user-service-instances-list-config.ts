import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { CurrentUserPermissions } from '../../../../../../../core/src/core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../../../../core/src/core/current-user-permissions.service';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { ITableColumn } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import {
  defaultPaginationPageSizeOptionsTable,
  IListAction,
  IListConfig,
  ListViewTypes,
} from '../../../../../../../core/src/shared/components/list/list.component.types';
import { ListView } from '../../../../../../../store/src/actions/list.actions';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { IUserProvidedServiceInstance } from '../../../../../cf-api-svc.types';
import { CloudFoundrySpaceService } from '../../../../../features/cloud-foundry/services/cloud-foundry-space.service';
import { ServiceActionHelperService } from '../../../../data-services/service-action-helper.service';
import {
  CANCEL_ORG_ID_PARAM,
  CANCEL_SPACE_ID_PARAM,
  CANCEL_USER_PROVIDED,
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
  viewType = ListViewTypes.TABLE_ONLY;
  pageSizeOptions = defaultPaginationPageSizeOptionsTable;
  dataSource: ListDataSource<APIResource<IUserProvidedServiceInstance>>;
  defaultView = 'table' as ListView;
  text = {
    title: null,
    filter: null,
    noEntries: 'There are no user provided service instances'
  };

  private canDetachCache: CanCache = {};
  private canDeleteCache: CanCache = {};

  protected serviceInstanceColumns: ITableColumn<APIResource<IUserProvidedServiceInstance>>[] = [
    {
      columnId: 'name',
      headerCell: () => 'Service Instance',
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

  private listActionDelete: IListAction<APIResource> = {
    action: (item: APIResource) => this.deleteServiceInstance(item),
    label: 'Delete',
    description: 'Delete Service Instance',
    createVisible: (row$: Observable<APIResource<IUserProvidedServiceInstance>>) =>
      row$.pipe(
        switchMap(
          row => this.can(this.canDeleteCache, CurrentUserPermissions.SERVICE_INSTANCE_DELETE, row.entity.cfGuid, row.entity.space_guid)
        )
      )
  };

  private listActionDetach: IListAction<APIResource> = {
    action: (item: APIResource) => this.deleteServiceBinding(item),
    label: 'Unbind',
    description: 'Unbind Service Instance',
    createEnabled: (row$: Observable<APIResource<IUserProvidedServiceInstance>>) =>
      row$.pipe(map(row => row.entity.service_bindings.length !== 0)),
    createVisible: (row$: Observable<APIResource<IUserProvidedServiceInstance>>) =>
      row$.pipe(
        switchMap(
          row => this.can(this.canDetachCache, CurrentUserPermissions.SERVICE_BINDING_EDIT, row.entity.cfGuid, row.entity.space_guid)
        )
      )
  };

  private listActionEdit: IListAction<APIResource> = {
    action: (item: APIResource<IUserProvidedServiceInstance>) =>
      this.serviceActionHelperService.startEditServiceBindingStepper(
        item.metadata.guid,
        item.entity.cfGuid,
        {
          [CANCEL_SPACE_ID_PARAM]: item.entity.space_guid,
          [CANCEL_ORG_ID_PARAM]: item.entity.space.entity.organization_guid,
          [CANCEL_USER_PROVIDED]: true
        },
        true),
    label: 'Edit',
    description: 'Edit Service Instance',
    createVisible: (row$: Observable<APIResource<IUserProvidedServiceInstance>>) =>
      row$.pipe(
        switchMap(
          row => this.can(this.canDetachCache, CurrentUserPermissions.SERVICE_BINDING_EDIT, row.entity.cfGuid, row.entity.space_guid)
        )
      )
  };

  private can(cache: CanCache, perm: CurrentUserPermissions, cfGuid: string, spaceGuid: string): Observable<boolean> {
    let can = cache[spaceGuid];
    if (!can) {
      can = this.currentUserPermissionsService.can(perm, cfGuid, spaceGuid);
      cache[spaceGuid] = can;
    }
    return can;
  }

  constructor(
    protected store: Store<CFAppState>,
    cfSpaceService: CloudFoundrySpaceService,
    protected datePipe: DatePipe,
    protected currentUserPermissionsService: CurrentUserPermissionsService,
    private serviceActionHelperService: ServiceActionHelperService
  ) {
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

  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [this.listActionEdit, this.listActionDetach, this.listActionDelete];
  getMultiFiltersConfigs = () => [];
  getColumns = () => this.serviceInstanceColumns;
  getDataSource = () => this.dataSource;

}
