import { Store } from '@ngrx/store';

import { serviceInstancesEntityType } from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { GetServiceInstances } from '../../../../../../../cloud-foundry/src/actions/service-instances.actions';
import { GetAllUserProvidedServices } from '../../../../../../../cloud-foundry/src/actions/user-provided-service.actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { ActionSchemaConfig, MultiActionConfig } from '../../data-sources-controllers/list-data-source-config';
import { IListConfig } from '../../list.component.types';
import { entityCatalogue } from '../../../../../core/entity-catalogue/entity-catalogue.service';
import { CF_ENDPOINT_TYPE } from '../../../../../../../cloud-foundry/cf-types';

export class ServiceInstancesWallDataSource extends ListDataSource<APIResource> {

  constructor(store: Store<CFAppState>, transformEntities: any[], listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(serviceInstancesEntityType);
    const serviceInstanceEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, serviceInstancesEntityType);
    const actionBuilder = serviceInstanceEntity.actionOrchestrator.getActionBuilder('getMultiple');
    const marketplaceAction = actionBuilder(null, paginationKey);
    //TODO Kate verify OK
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
