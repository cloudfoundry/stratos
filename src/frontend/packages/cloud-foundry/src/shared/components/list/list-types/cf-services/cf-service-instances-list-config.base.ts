import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  CurrentUserPermissionsService,
} from '../../../../../../../core/src/core/permissions/current-user-permissions.service';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { ITableColumn, ITableText } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import {
  defaultPaginationPageSizeOptionsTable,
  IListAction,
  IListConfig,
  ListViewTypes,
} from '../../../../../../../core/src/shared/components/list/list.component.types';
import { ListView } from '../../../../../../../store/src/actions/list.actions';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { IServiceInstance } from '../../../../../cf-api-svc.types';
import { CfCurrentUserPermissions } from '../../../../../user-permissions/cf-user-permissions-checkers';
import { ServiceActionHelperService } from '../../../../data-services/service-action-helper.service';
import { CANCEL_ORG_ID_PARAM, CANCEL_SPACE_ID_PARAM } from '../../../add-service-instance/csi-mode.service';
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
  dataSource: ListDataSource<APIResource>;
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
      headerCell: () => 'Service Instance',
      cellDefinition: {
        getValue: (row) => `${row.entity.name}`
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
      cellFlex: '2'
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
        getLink: (row: APIResource<IServiceInstance>) => row.entity.dashboard_url,
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
    createVisible: (row$: Observable<APIResource<IServiceInstance>>) =>
      row$.pipe(
        switchMap(
          row => this.can(this.canDeleteCache, CfCurrentUserPermissions.SERVICE_INSTANCE_DELETE, row.entity.cfGuid, row.entity.space_guid)
        )
      )
  };

  private listActionDetach: IListAction<APIResource> = {
    action: (item: APIResource) => this.deleteServiceBinding(item),
    label: 'Unbind',
    description: 'Unbind Service Instance',
    createEnabled: (row$: Observable<APIResource<IServiceInstance>>) => row$.pipe(map(row => row.entity.service_bindings.length !== 0)),
    createVisible: (row$: Observable<APIResource<IServiceInstance>>) =>
      row$.pipe(
        switchMap(
          row => this.can(this.canDetachCache, CfCurrentUserPermissions.SERVICE_BINDING_EDIT, row.entity.cfGuid, row.entity.space_guid)
        )
      )
  };

  private listActionEdit: IListAction<APIResource> = {
    action: (item: APIResource<IServiceInstance>) =>
      this.serviceActionHelperService.startEditServiceBindingStepper(item.metadata.guid, item.entity.cfGuid, {
        [CANCEL_SPACE_ID_PARAM]: item.entity.space_guid,
        [CANCEL_ORG_ID_PARAM]: item.entity.space.entity.organization_guid
      }),
    label: 'Edit',
    description: 'Edit Service Instance',
    createVisible: (row$: Observable<APIResource<IServiceInstance>>) =>
      row$.pipe(
        switchMap(
          row => this.can(this.canDetachCache, CfCurrentUserPermissions.SERVICE_BINDING_EDIT, row.entity.cfGuid, row.entity.space_guid)
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

  constructor(
    protected store: Store<CFAppState>,
    protected datePipe: DatePipe,
    protected currentUserPermissionsService: CurrentUserPermissionsService,
    private serviceActionHelperService: ServiceActionHelperService
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

  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [this.listActionEdit, this.listActionDetach, this.listActionDelete];
  getMultiFiltersConfigs = () => [];
  getColumns = () => this.serviceInstanceColumns;
  getDataSource = () => null;

}
