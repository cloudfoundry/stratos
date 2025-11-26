import { Store } from '@ngrx/store';
import { getRowMetadata, type GeneralEntityAppState } from '@stratosui/store';

import type { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  applicationEntityType,
  organizationEntityType,
  serviceBindingEntityType,
  spaceEntityType,
  spaceWithOrgEntityType,
  userProvidedServiceInstanceEntityType,
} from '../../../../../../../cloud-foundry/src/cf-entity-types';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import {
  ListDataSource,
} from '@stratosui/core';
import {
  defaultPaginationPageSizeOptionsTable,
  type IListConfig,
} from '@stratosui/core';
import type { APIResource } from '../../../../../../../store/src/types/api.types';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../../../cf-entity-factory';

export class CfSpacesUserServiceInstancesDataSource extends ListDataSource<APIResource> {
  constructor(cfGuid: string, spaceGuid: string, store: Store<GeneralEntityAppState>, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(spaceEntityType, spaceGuid);
    const action = cfEntityCatalog.userProvidedService.actions.getAllInSpace(
      cfGuid, spaceGuid, paginationKey,
      [
        createEntityRelationKey(userProvidedServiceInstanceEntityType, spaceWithOrgEntityType),
        createEntityRelationKey(spaceEntityType, organizationEntityType),
        createEntityRelationKey(userProvidedServiceInstanceEntityType, serviceBindingEntityType),
        createEntityRelationKey(serviceBindingEntityType, applicationEntityType)
      ], true,
    );
    action.initialParams['results-per-page'] = defaultPaginationPageSizeOptionsTable[0];
    action.initialParams['order-direction-field'] = 'creation';
    action.flattenPagination = false;
    super({
      store,
      action,
      schema: cfEntityFactory(userProvidedServiceInstanceEntityType),
      getRowUniqueId: getRowMetadata,
      paginationKey,
      isLocal: false,
      transformEntities: [],
      listConfig
    });
  }
}
