import { Store } from '@ngrx/store';

import { GetAllUserProvidedServices } from '../../../../../../../store/src/actions/user-provided-service.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import {
  applicationSchemaKey,
  entityFactory,
  organizationSchemaKey,
  serviceBindingSchemaKey,
  spaceSchemaKey,
  spaceWithOrgKey,
  userProvidedServiceInstanceSchemaKey,
} from '../../../../../../../store/src/helpers/entity-factory';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../../../store/src/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { defaultPaginationPageSizeOptionsTable, IListConfig } from '../../list.component.types';

export class CfSpacesUserServiceInstancesDataSource extends ListDataSource<APIResource> {
  constructor(cfGuid: string, spaceGuid: string, store: Store<AppState>, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(spaceSchemaKey, spaceGuid);
    const action = new GetAllUserProvidedServices(paginationKey, cfGuid, [
      createEntityRelationKey(userProvidedServiceInstanceSchemaKey, spaceWithOrgKey),
      createEntityRelationKey(spaceSchemaKey, organizationSchemaKey),
      createEntityRelationKey(userProvidedServiceInstanceSchemaKey, serviceBindingSchemaKey),
      createEntityRelationKey(serviceBindingSchemaKey, applicationSchemaKey)
    ], true, spaceGuid);
    action.initialParams['results-per-page'] = defaultPaginationPageSizeOptionsTable[0];
    action.initialParams['order-direction-field'] = 'creation';
    action.flattenPagination = false;
    super({
      store,
      action,
      schema: entityFactory(userProvidedServiceInstanceSchemaKey),
      getRowUniqueId: getRowMetadata,
      paginationKey,
      isLocal: false,
      transformEntities: [],
      listConfig
    });
  }
}
