import { Injectable } from '@angular/core';
import { CfSpacesServiceInstancesDataSource } from './cf-spaces-service-instances-data-source';
import { ListViewTypes, IListAction, ListConfig, IListConfig } from '../../list.component.types';
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
import {
  TableCellServiceInstanceAppsAttachedComponent
} from './table-cell-service-instance-apps-attached/table-cell-service-instance-apps-attached.component';
import { DeleteServiceInstance, DeleteServiceBinding } from '../../../../../store/actions/service-instances.actions';
import { RouterNav } from '../../../../../store/actions/router.actions';
@Injectable()
export class CfSpacesServiceInstancesListConfigService
  extends ListConfig<APIResource<CfServiceInstance>>
  implements IListConfig<APIResource<CfServiceInstance>>  {
  viewType = ListViewTypes.TABLE_ONLY;
  dataSource: CfSpacesServiceInstancesDataSource;
  defaultView = 'table' as ListView;
  text = {
    title: null,
    noEntries: 'There are no service instances'
  };

  private serviceInstanceColumns: ITableColumn<APIResource<CfServiceInstance>>[] = [
    {
      columnId: 'name',
      headerCell: () => 'Service Instances',
      cellDefinition: {
        getValue: (row) => `${row.entity.name}`
      },
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'entity.name'
      },
      cellFlex: '2'
    },
    {
      columnId: 'service',
      headerCell: () => 'Service',
      cellComponent: TableCellServiceNameComponent,
      cellFlex: '1'
    },
    {
      columnId: 'servicePlan',
      headerCell: () => 'Plan',
      cellComponent: TableCellServicePlanComponent,
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
      headerCell: () => 'Application Attached',
      cellComponent: TableCellServiceInstanceAppsAttachedComponent,
      cellFlex: '3'
    },
  ];

  private listActionDelete: IListAction<APIResource> = {
    action: (item: APIResource) => this.deleteServiceInstance(item),
    icon: 'delete',
    label: 'Delete',
    description: 'Delete Service Instance',
    visible: (row: APIResource) => true,
    enabled: (row: APIResource) => true
  };

  private listActionDetach: IListAction<APIResource> = {
    action: (item: APIResource) => this.deleteServiceBinding(item),
    icon: 'settings',
    label: 'Detach',
    description: 'Detach Service Instance',
    visible: (row: APIResource) => true,
    enabled: (row: APIResource) => row.entity.service_bindings.length === 1
  };

  constructor(private store: Store<AppState>, private cfSpaceService: CloudFoundrySpaceService) {
    super();
    this.dataSource = new CfSpacesServiceInstancesDataSource(cfSpaceService.cfGuid, cfSpaceService.spaceGuid, this.store, this);
  }

  deleteServiceInstance = (serviceInstance: APIResource<CfServiceInstance>) =>
    this.store.dispatch(new DeleteServiceInstance(this.cfSpaceService.cfGuid, serviceInstance.metadata.guid))


  deleteServiceBinding = (serviceInstance: APIResource<CfServiceInstance>) => {
    /**
     * If only one binding exists, carry out the action otherwise
     * take user to a form to select which app binding they want to remove
    **/
    if (serviceInstance.entity.service_bindings.length === 1) {
      this.store.dispatch(new DeleteServiceBinding(
        this.cfSpaceService.cfGuid,
        serviceInstance.entity.service_bindings[0].metadata.guid));
    } else {
      this.store.dispatch(new RouterNav({ path: ['services', serviceInstance.entity.service_guid, 'detach-service-binding'] }));
    }
  }

  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [this.listActionDetach, this.listActionDelete];
  getMultiFiltersConfigs = () => [];
  getColumns = () => this.serviceInstanceColumns;
  getDataSource = () => this.dataSource;

}
