import { Store } from '@ngrx/store';

import { getRowMetadata, APIResource } from '@stratosui/store';
import { ListDataSource, IListConfig } from '@stratosui/core';
import { CFAppState, applicationEntityType, serviceBindingEntityType, serviceEntityType, serviceInstancesEntityType, servicePlanEntityType, ApplicationService, IServiceBinding, cfEntityCatalog } from '@stratosui/cloud-foundry';
import { createEntityRelationKey, createEntityRelationPaginationKey } from '../../../../../entity-relations/entity-relations.types';
import { cfEntityFactory } from '../../../../../cf-entity-factory';

export class AppServiceBindingDataSource extends ListDataSource<APIResource<IServiceBinding>> {
  static createGetAllServiceBindings(appGuid: string, cfGuid: string) {

    const paginationKey = createEntityRelationPaginationKey(serviceBindingEntityType, appGuid);
    return cfEntityCatalog.serviceBinding.actions.getAllForApplication(
      appGuid, cfGuid, paginationKey, {
        includeRelations: [
          createEntityRelationKey(serviceBindingEntityType, applicationEntityType),
          createEntityRelationKey(serviceBindingEntityType, serviceInstancesEntityType),
          createEntityRelationKey(serviceInstancesEntityType, servicePlanEntityType),
          createEntityRelationKey(servicePlanEntityType, serviceEntityType),
        ],
        populateMissing: true
      });
  }

  constructor(store: Store<CFAppState>, appService: ApplicationService, listConfig?: IListConfig<APIResource<IServiceBinding>>) {
    const action = AppServiceBindingDataSource.createGetAllServiceBindings(appService.appGuid, appService.cfGuid);
    super({
      store,
      action,
      schema: cfEntityFactory(serviceBindingEntityType),
      getRowUniqueId: getRowMetadata,
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntities: [],
      listConfig
    });
  }



}
