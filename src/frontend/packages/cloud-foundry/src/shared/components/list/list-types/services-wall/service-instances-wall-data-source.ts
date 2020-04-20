import { Store } from '@ngrx/store';

import { GetAllUserProvidedServices } from '../../../../../../../cloud-foundry/src/actions/user-provided-service.actions';
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
import { entityCatalog } from '../../../../../../../store/src/entity-catalog/entity-catalog.service';
import { IEntityMetadata } from '../../../../../../../store/src/entity-catalog/entity-catalog.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginatedAction, PaginationParam } from '../../../../../../../store/src/types/pagination.types';
import { CF_ENDPOINT_TYPE } from '../../../../../cf-types';
import { ServiceInstanceActionBuilders } from '../../../../../entity-action-builders/service-instance.action.builders';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { CFListDataSource } from '../../../../cf-list-data-source';
import { createCfOrSpaceMultipleFilterFn } from '../../../../data-services/cf-org-space-service.service';

export class ServiceInstancesWallDataSource extends CFListDataSource<APIResource> {
  constructor(store: Store<CFAppState>, transformEntities: any[], listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(serviceInstancesEntityType);
    const serviceInstanceEntity = entityCatalog
      .getEntity<IEntityMetadata, any, ServiceInstanceActionBuilders>(CF_ENDPOINT_TYPE, serviceInstancesEntityType);
    const actionBuilder = serviceInstanceEntity.actionOrchestrator.getActionBuilder('getMultiple');
    const marketplaceAction = actionBuilder(null, paginationKey);
    const userProvidedAction = new GetAllUserProvidedServices();
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
