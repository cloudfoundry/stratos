import { Store } from '@ngrx/store';
import { getRowMetadata, type APIResource, type PaginatedAction, type PaginationParam , type GeneralEntityAppState } from '@stratosui/store';

import {
  type CFAppState,
  serviceInstancesEntityType,
  createEntityRelationPaginationKey,
  cfEntityCatalog,
  createCfOrSpaceMultipleFilterFn,
} from '@stratosui/cloud-foundry';
import {
  ActionSchemaConfig,
  MultiActionConfig,
  type DataFunction,
  type DataFunctionDefinition,
  type ListPaginationMultiFilterChange,
  type IListConfig,
} from '@stratosui/core';
import { CFListDataSource } from '../../../../cf-list-data-source';

export class ServiceInstancesWallDataSource extends CFListDataSource<APIResource> {
  constructor(store: Store<GeneralEntityAppState>, transformEntities: (DataFunction<APIResource> | DataFunctionDefinition)[], listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(serviceInstancesEntityType);
    const marketplaceAction = cfEntityCatalog.serviceInstance.actions.getMultiple(null, paginationKey);
    const userProvidedPaginationKey = createEntityRelationPaginationKey('userProvidedServiceInstance');
    const userProvidedAction = cfEntityCatalog.userProvidedService.actions.getMultiple(
      userProvidedPaginationKey,
      null,
      { includeRelations: [], populateMissing: false }
    );
    const actionSchemaConfigs = [
      new ActionSchemaConfig(
        marketplaceAction
      ),
      new ActionSchemaConfig(
        userProvidedAction
      ),
    ];
    const multiAction = new MultiActionConfig(
      actionSchemaConfigs,
      'Service Type'
    );
    super({
      store,
      action: marketplaceAction,
      schema: multiAction,
      getRowUniqueId: getRowMetadata,
      paginationKey,
      isLocal: true,
      transformEntities,
      listConfig
    });

    this.setMultiFilter = (changes: ListPaginationMultiFilterChange[], params: PaginationParam) => {
      // Org and Space params are set in the pagination object
      // Cf Guid is applied directly to the action that, by reference, is dispatched when we fetch the list (nasty)
      // For multi action lists like this one patch each action with the correct cf guid.
      const preResetUpdate = () => {
        const paginationActions = this.action as PaginatedAction[];
        paginationActions.forEach(action => {
          action.endpointGuid = this.masterAction.endpointGuid;
        });
      };
      return createCfOrSpaceMultipleFilterFn(store, this.masterAction, this.setQParam, preResetUpdate)(changes, params);
    };
  }
}
