import { Store } from '@ngrx/store';

import { GetAllUserProvidedServices } from '../../../../../../../cloud-foundry/src/actions/user-provided-service.actions';
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
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { entityCatalogue } from '../../../../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { CF_ENDPOINT_TYPE } from '../../../../../../cf-types';
import { UserProvidedServiceActionBuilder } from '../../../../../entity-action-builders/user-provided-service.action-builders';

export class CfSpacesUserServiceInstancesDataSource extends ListDataSource<APIResource> {
  constructor(cfGuid: string, spaceGuid: string, store: Store<CFAppState>, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(spaceEntityType, spaceGuid);
    const userProvidedServiceEntity = entityCatalogue.getEntity<any, any, UserProvidedServiceActionBuilder>(
      CF_ENDPOINT_TYPE,
      userProvidedServiceInstanceEntityType
    );
    const actionBuilder = userProvidedServiceEntity.actionOrchestrator.getActionBuilder('getAllInSpace');
    const action = actionBuilder(cfGuid, spaceGuid, paginationKey,
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
