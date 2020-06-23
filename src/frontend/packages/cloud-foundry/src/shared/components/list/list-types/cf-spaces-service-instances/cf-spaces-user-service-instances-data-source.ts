import { Store } from '@ngrx/store';
import { getRowMetadata } from '@stratosui/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
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
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import {
  defaultPaginationPageSizeOptionsTable,
  IListConfig,
} from '../../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../../../cf-entity-factory';

export class CfSpacesUserServiceInstancesDataSource extends ListDataSource<APIResource> {
  constructor(cfGuid: string, spaceGuid: string, store: Store<CFAppState>, listConfig?: IListConfig<APIResource>) {
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
