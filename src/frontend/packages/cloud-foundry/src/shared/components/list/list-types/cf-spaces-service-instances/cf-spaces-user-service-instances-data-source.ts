import { Store } from '@ngrx/store';

import { GetAllUserProvidedServices } from '../../../../../../../cloud-foundry/src/actions/user-provided-service.actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  applicationEntityType,
  cfEntityFactory,
  organizationEntityType,
  serviceBindingEntityType,
  spaceEntityType,
  spaceWithOrgEntityType,
  userProvidedServiceInstanceEntityType,
} from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import {
  defaultPaginationPageSizeOptionsTable,
  IListConfig,
} from '../../../../../../../core/src/shared/components/list/list.component.types';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';

export class CfSpacesUserServiceInstancesDataSource extends ListDataSource<APIResource> {
  constructor(cfGuid: string, spaceGuid: string, store: Store<CFAppState>, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(spaceEntityType, spaceGuid);
    const action = new GetAllUserProvidedServices(paginationKey, cfGuid, [
      createEntityRelationKey(userProvidedServiceInstanceEntityType, spaceWithOrgEntityType),
      createEntityRelationKey(spaceEntityType, organizationEntityType),
      createEntityRelationKey(userProvidedServiceInstanceEntityType, serviceBindingEntityType),
      createEntityRelationKey(serviceBindingEntityType, applicationEntityType)
    ], true, spaceGuid);
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
