import { Store } from '@ngrx/store';

import { GetServiceInstances } from '../../../../../../../store/src/actions/service-instances.actions';
import { GetAllUserProvidedServices } from '../../../../../../../store/src/actions/user-provided-service.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import {
  serviceInstancesSchemaKey,
  serviceInstancesWithSpaceSchemaKey,
  userProvidedServiceInstanceSchemaKey,
} from '../../../../../../../store/src/helpers/entity-factory';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../../store/src/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { ActionSchemaConfig, MultiActionConfig } from '../../data-sources-controllers/list-data-source-config';
import { IListConfig } from '../../list.component.types';

export class ServiceInstancesWallDataSource extends ListDataSource<APIResource> {

  constructor(store: Store<AppState>, transformEntities: any[], listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(serviceInstancesSchemaKey);
    const marketplaceAction = new GetServiceInstances(null, paginationKey);
    const userProvidedAction = new GetAllUserProvidedServices();
    const actionSchemaConfigs = [
      new ActionSchemaConfig(
        marketplaceAction,
        serviceInstancesWithSpaceSchemaKey,
        'Marketplace'
      ),
      new ActionSchemaConfig(
        userProvidedAction,
        userProvidedServiceInstanceSchemaKey,
        'User Provided'
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
  }
}
