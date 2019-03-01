import { Store } from '@ngrx/store';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { GetServiceInstances } from '../../../../../store/actions/service-instances.actions';
import { GetAllUserProvidedServices } from '../../../../../store/actions/user-provided-service.actions';
import { AppState } from '../../../../../store/app-state';
import {
  serviceInstancesSchemaKey,
  serviceInstancesWithSpaceSchemaKey,
  userProvidedServiceInstanceSchemaKey
} from '../../../../../store/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../../../../store/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../store/types/api.types';
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
      transformEntities: transformEntities,
      listConfig
    });
  }
}
