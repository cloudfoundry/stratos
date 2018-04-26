import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { IServiceInstance } from '../../../../../core/cf-api-svc.types';
import { ServicesService } from '../../../../../features/service-catalog/services.service';
import { ListView } from '../../../../../store/actions/list.actions';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { ITableColumn } from '../../list-table/table.types';
import { IListConfig, ListConfig, ListViewTypes, IListAction } from '../../list.component.types';
import {
  TableCellServiceInstanceAppsAttachedComponent,
} from '../cf-spaces-service-instances/table-cell-service-instance-apps-attached/table-cell-service-instance-apps-attached.component';
import {
  TableCellServiceInstanceTagsComponent,
} from '../cf-spaces-service-instances/table-cell-service-instance-tags/table-cell-service-instance-tags.component';
import {
  TableCellServiceNameComponent,
} from '../cf-spaces-service-instances/table-cell-service-name/table-cell-service-name.component';
import {
  TableCellServicePlanComponent,
} from '../cf-spaces-service-instances/table-cell-service-plan/table-cell-service-plan.component';
import { ServiceInstancesDataSource } from './service-instances-data-source';
import { DeleteServiceInstance, DeleteServiceBinding } from '../../../../../store/actions/service-instances.actions';
import { RouterNav } from '../../../../../store/actions/router.actions';

@Injectable()
export class ServiceInstancesListConfigService
  extends ListConfig<APIResource<IServiceInstance>>
  implements IListConfig<APIResource<IServiceInstance>> {
  viewType = ListViewTypes.TABLE_ONLY;
  dataSource: ServiceInstancesDataSource;
  defaultView = 'table' as ListView;
  text = {
    title: null,
    noEntries: 'There are no service instances'
  };
  private listActionDelete: IListAction<APIResource> = {
    action: (item: APIResource) => this.deleteServiceInstance(item),
    label: 'Delete',
    description: 'Delete Service Instance',
    visible: (row: APIResource) => true,
    enabled: (row: APIResource) => true
  };

  private listActionDetach: IListAction<APIResource> = {
    action: (item: APIResource) => this.deleteServiceBinding(item),
    label: 'Detach',
    description: 'Detach Service Instance',
    visible: (row: APIResource) => true,
    enabled: (row: APIResource) => row.entity.service_bindings.length === 1
  };


  static getColumns = (datePipe: DatePipe): ITableColumn<APIResource<IServiceInstance>>[] =>
    [
      {
        columnId: 'name', headerCell: () => 'Service Instances',
        cellDefinition: { getValue: (row) => `${row.entity.name}` }, cellFlex: '2'
      },
      {
        columnId: 'servicePlan', headerCell: () => 'Plan', cellComponent: TableCellServicePlanComponent, cellFlex: '1'
      },
      {
        columnId: 'tags', headerCell: () => 'Tags', cellComponent: TableCellServiceInstanceTagsComponent, cellFlex: '2'
      },
      {
        columnId: 'attachedApps',
        headerCell: () => 'Application Attached', cellComponent: TableCellServiceInstanceAppsAttachedComponent, cellFlex: '3'
      },
      {
        columnId: 'creation', headerCell: () => 'Creation Date', cellDefinition: {
          getValue: (row: APIResource) => `${datePipe.transform(row.metadata.created_at, 'medium')}`
        }, sort: {
          type: 'sort', orderKey: 'creation', field: 'metadata.created_at'
        }, cellFlex: '2'
      },
    ]


  constructor(private store: Store<AppState>, private servicesService: ServicesService, private datePipe: DatePipe) {
    super();
    this.dataSource = new ServiceInstancesDataSource(servicesService.cfGuid, servicesService.serviceGuid, store, this);
  }


  deleteServiceInstance = (serviceInstance: APIResource<IServiceInstance>) =>
    this.store.dispatch(new DeleteServiceInstance(this.servicesService.cfGuid, serviceInstance.metadata.guid))


  deleteServiceBinding = (serviceInstance: APIResource<IServiceInstance>) => {
    /**
     * If only one binding exists, carry out the action otherwise
     * take user to a form to select which app binding they want to remove
    **/
    if (serviceInstance.entity.service_bindings.length === 1) {
      this.store.dispatch(new DeleteServiceBinding(
        this.servicesService.cfGuid,
        serviceInstance.entity.service_bindings[0].metadata.guid));
    } else {
      this.store.dispatch(new RouterNav({ path: ['services', serviceInstance.entity.service_guid, 'detach-service-binding'] }));
    }
  }
  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [this.listActionDetach, this.listActionDelete];
  getMultiFiltersConfigs = () => [];
  getColumns = () => ServiceInstancesListConfigService.getColumns(this.datePipe);
  getDataSource = () => this.dataSource;
}
