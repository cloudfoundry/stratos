import { Store } from '@ngrx/store';

import { getRowMetadata, type APIResource, type GeneralEntityAppState } from '@stratosui/store';
import { ListDataSource, type IListConfig } from '@stratosui/core';
import { type CFAppState, applicationEntityType, serviceBindingEntityType, serviceEntityType, serviceInstancesEntityType, servicePlanEntityType, ApplicationService, type IServiceBinding, cfEntityCatalog } from '@stratosui/cloud-foundry';
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

  constructor(store: Store<GeneralEntityAppState>, appService: ApplicationService, listConfig?: IListConfig<APIResource<IServiceBinding>>) {
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
