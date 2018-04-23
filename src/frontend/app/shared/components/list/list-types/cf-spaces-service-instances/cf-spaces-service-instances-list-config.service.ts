import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { IServiceInstance } from '../../../../../core/cf-api-svc.types';
import { CloudFoundrySpaceService } from '../../../../../features/cloud-foundry/services/cloud-foundry-space.service';
import { ListView } from '../../../../../store/actions/list.actions';
import { RouterNav } from '../../../../../store/actions/router.actions';
import { DeleteServiceBinding, DeleteServiceInstance } from '../../../../../store/actions/service-instances.actions';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { IListAction, IListConfig, ListConfig, ListViewTypes } from '../../list.component.types';
import { ServiceInstancesListConfigService } from '../service-instances/service-instances-list-config.service';
import { CfSpacesServiceInstancesDataSource } from './cf-spaces-service-instances-data-source';

@Injectable()
export class CfSpacesServiceInstancesListConfigService extends ListConfig<APIResource<IServiceInstance>>
  implements IListConfig<APIResource<IServiceInstance>>  {
  viewType = ListViewTypes.TABLE_ONLY;
  dataSource: CfSpacesServiceInstancesDataSource;
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

  constructor(private store: Store<AppState>, private cfSpaceService: CloudFoundrySpaceService, private datePipe: DatePipe) {
    super();
    this.dataSource = new CfSpacesServiceInstancesDataSource(cfSpaceService.cfGuid, cfSpaceService.spaceGuid, this.store, this);
  }

  deleteServiceInstance = (serviceInstance: APIResource<IServiceInstance>) =>
    this.store.dispatch(new DeleteServiceInstance(this.cfSpaceService.cfGuid, serviceInstance.metadata.guid))


  deleteServiceBinding = (serviceInstance: APIResource<IServiceInstance>) => {
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
  getColumns = () => ServiceInstancesListConfigService.getColumns(this.datePipe);
  getDataSource = () => this.dataSource;

}
