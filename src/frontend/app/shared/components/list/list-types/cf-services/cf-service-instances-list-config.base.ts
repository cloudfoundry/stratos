import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { IServiceInstance } from '../../../../../core/cf-api-svc.types';
import { ListDataSource } from '../../../../../shared/components/list/data-sources-controllers/list-data-source';
import { ListView } from '../../../../../store/actions/list.actions';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { ServiceActionHelperService } from '../../../../data-services/service-action-helper.service';
import { ITableColumn } from '../../list-table/table.types';
import { IListAction, IListConfig, ListConfig, ListViewTypes } from '../../list.component.types';
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
import { Observable } from 'rxjs/Observable';

@Injectable()
export class CfServiceInstancesListConfigBase extends ListConfig<APIResource<IServiceInstance>>
  implements IListConfig<APIResource<IServiceInstance>>  {
  viewType = ListViewTypes.TABLE_ONLY;
  dataSource: ListDataSource<APIResource>;
  defaultView = 'table' as ListView;
  text = {
    title: null,
    filter: null,
    noEntries: 'There are no service instances'
  };

  protected serviceInstanceColumns: ITableColumn<APIResource<IServiceInstance>>[] = [
    {
      columnId: 'name',
      headerCell: () => 'Service Instances',
      cellDefinition: {
        getValue: (row) => `${row.entity.name}`
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
    createVisible: (row) => Observable.of(true),
    createEnabled: (row) => Observable.of(true)
  };

  private listActionDetach: IListAction<APIResource> = {
    action: (item: APIResource) => this.deleteServiceBinding(item),
    label: 'Detach',
    description: 'Detach Service Instance',
    createVisible: (row: APIResource) => Observable.of(true),
    createEnabled: (row: APIResource) => Observable.of(row.entity.service_bindings.length === 1)
  };

  constructor(
    protected store: Store<AppState>,
    protected datePipe: DatePipe,
    private serviceActionHelperService: ServiceActionHelperService
  ) {
    super();
  }

  deleteServiceInstance = (serviceInstance: APIResource<IServiceInstance>) =>
    this.serviceActionHelperService.deleteServiceInstance(serviceInstance.metadata.guid, serviceInstance.entity.cfGuid)


  deleteServiceBinding = (serviceInstance: APIResource<IServiceInstance>) => {

    /**
     * If only one binding exists, carry out the action otherwise
     * take user to a form to select which app binding they want to remove
    **/
    const serviceBindingGuid = serviceInstance.entity.service_bindings[0].metadata.guid;
    this.serviceActionHelperService.detachServiceBinding(
      serviceBindingGuid,
      serviceInstance.metadata.guid,
      serviceInstance.entity.cfGuid
    );
  }

  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [this.listActionDetach, this.listActionDelete];
  getMultiFiltersConfigs = () => [];

}
