import { Store } from '@ngrx/store';

import {
  applicationEntityType,
  cfEntityFactory,
  organizationEntityType,
  serviceBindingEntityType,
  spaceEntityType,
  spaceWithOrgEntityType,
  userProvidedServiceInstanceEntityType,
} from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { GetAllUserProvidedServices } from '../../../../../../../store/src/actions/user-provided-service.actions';
import { CFAppState } from '../../../../../../../store/src/app-state';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../../../store/src/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { defaultPaginationPageSizeOptionsTable, IListConfig } from '../../list.component.types';

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
