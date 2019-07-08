import { Store } from '@ngrx/store';

import { serviceInstancesEntityType } from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { GetServiceInstances } from '../../../../../../../cloud-foundry/src/actions/service-instances.actions';
import { GetAllUserProvidedServices } from '../../../../../../../cloud-foundry/src/actions/user-provided-service.actions';
import { CFAppState } from '../../../../../../../store/src/app-state';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../../store/src/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { ActionSchemaConfig, MultiActionConfig } from '../../data-sources-controllers/list-data-source-config';
import { IListConfig } from '../../list.component.types';

export class ServiceInstancesWallDataSource extends ListDataSource<APIResource> {

  constructor(store: Store<CFAppState>, transformEntities: any[], listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(serviceInstancesEntityType);
    const marketplaceAction = new GetServiceInstances(null, paginationKey);
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
  }
}
