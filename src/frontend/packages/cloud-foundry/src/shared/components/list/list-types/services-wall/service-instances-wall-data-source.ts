import { Store } from '@ngrx/store';
import { getRowMetadata } from '@stratosui/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { serviceInstancesEntityType } from '../../../../../../../cloud-foundry/src/cf-entity-types';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import {
  ActionSchemaConfig,
  MultiActionConfig,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-config';
import {
  ListPaginationMultiFilterChange,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-types';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginatedAction, PaginationParam } from '../../../../../../../store/src/types/pagination.types';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { CFListDataSource } from '../../../../cf-list-data-source';
import { createCfOrSpaceMultipleFilterFn } from '../../../../data-services/cf-org-space-service.service';

export class ServiceInstancesWallDataSource extends CFListDataSource<APIResource> {
  constructor(store: Store<CFAppState>, transformEntities: any[], listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(serviceInstancesEntityType);
    const marketplaceAction = cfEntityCatalog.serviceInstance.actions.getMultiple(null, paginationKey);
    const userProvidedAction = cfEntityCatalog.userProvidedService.actions.getMultiple();
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
        paginationActions.forEach(action => action.endpointGuid = this.masterAction.endpointGuid);
      };
      return createCfOrSpaceMultipleFilterFn(store, this.masterAction, this.setQParam, preResetUpdate)(changes, params);
    };
  }
}
