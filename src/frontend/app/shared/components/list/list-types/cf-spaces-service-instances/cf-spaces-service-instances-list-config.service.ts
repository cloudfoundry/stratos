import { Injectable } from '@angular/core';
import { CfSpacesServiceInstancesDataSource } from './cf-spaces-service-instances-data-source';
import { ListViewTypes } from '../../list.component.types';
import { ListView } from '../../../../../store/actions/list.actions';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/app-state';
import { CloudFoundrySpaceService } from '../../../../../features/cloud-foundry/services/cloud-foundry-space.service';
import { APIResource } from '../../../../../store/types/api.types';
import { ITableColumn } from '../../list-table/table.types';
import { CfServiceInstance } from '../../../../../store/types/service.types';
import { TableCellServiceNameComponent } from './table-cell-service-name/table-cell-service-name.component';
import { TableCellServicePlanComponent } from './table-cell-service-plan/table-cell-service-plan.component';
import { TableCellServiceInstanceTagsComponent } from './table-cell-service-instance-tags/table-cell-service-instance-tags.component';
import { TableCellServiceInstanceAppsAttachedComponent } from './table-cell-service-instance-apps-attached/table-cell-service-instance-apps-attached.component';
@Injectable()
export class CfSpacesServiceInstancesListConfigService {
  viewType = ListViewTypes.TABLE_ONLY;
  enableTextFilter = false;
  dataSource: CfSpacesServiceInstancesDataSource;
  pageSizeOptions = [9, 45, 90];
  defaultView = 'table' as ListView;

  private serviceInstanceColumns: ITableColumn<APIResource<CfServiceInstance>>[] = [
    {
      columnId: 'serviceInstances',
      headerCell: () => 'Service Instances',
      cell: row => row.entity.name,
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'name'
      },
      cellFlex: '2'
    },
    {
      columnId: 'service',
      headerCell: () => 'Service',
      cellComponent: TableCellServiceNameComponent,
      sort: {
        type: 'sort',
        orderKey: 'connection',
        field: 'info.user'
      },
      cellFlex: '1'
    },
    {
      columnId: 'servicePlan',
      headerCell: () => 'Plan',
      cellComponent: TableCellServicePlanComponent,
      sort: {
        type: 'sort',
        orderKey: 'connection',
        field: 'info.user'
      },
      cellFlex: '1'
    },
    {
      columnId: 'tags',
      headerCell: () => 'Tags',
      cellComponent: TableCellServiceInstanceTagsComponent,
      sort: {
        type: 'sort',
        orderKey: 'type',
        field: 'cnsi_type'
      },
      cellFlex: '2'
    },
    {
      columnId: 'attachedApps',
      headerCell: () => 'Application Attached',
      cellComponent: TableCellServiceInstanceAppsAttachedComponent,
      sort: {
        type: 'sort',
        orderKey: 'address',
        field: 'api_endpoint.Host'
      },
      cellFlex: '5'
    },
  ];

  constructor(private store: Store<AppState>, private cfSpaceService: CloudFoundrySpaceService) {
    this.dataSource = new CfSpacesServiceInstancesDataSource(cfSpaceService.cfGuid, cfSpaceService.spaceGuid, this.store, this);
  }

  getGlobalActions = () => [];
  // TODO implement actions
  getMultiActions = () => [];
  getSingleActions = () => [];
  getMultiFiltersConfigs = () => [];
  getColumns = () => this.serviceInstanceColumns;
  getDataSource = () => this.dataSource;

}
