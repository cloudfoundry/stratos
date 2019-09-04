import { Store } from '@ngrx/store';

import { CF_ENDPOINT_TYPE } from '../../../../../../../cloud-foundry/cf-types';
import { serviceEntityType } from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { GetAllServices } from '../../../../../../../cloud-foundry/src/actions/service.actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { endpointSchemaKey } from '../../../../../../../store/src/helpers/entity-factory';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginationEntityState } from '../../../../../../../store/src/types/pagination.types';
import { entityCatalogue } from '../../../../../core/entity-catalogue/entity-catalogue.service';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';

export class CfServicesDataSource extends ListDataSource<APIResource> {
  constructor(store: Store<CFAppState>, endpointGuid: string, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(endpointSchemaKey);
    const serviceEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, serviceEntityType);
    const actionBuilder = serviceEntity.actionOrchestrator.getActionBuilder('getMultiple');
    //TODO kate verify OK
    const getServicesAction = actionBuilder(endpointGuid, paginationKey);  
    super({
      store,
      action: getServicesAction,
      schema: entityCatalogue.getEntity(CF_ENDPOINT_TYPE, serviceEntityType).getSchema(),
      getRowUniqueId: getRowMetadata,
      paginationKey,
      isLocal: true,
      transformEntities: [
        {
          type: 'filter',
          field: 'entity.label'
        },
        (entities: APIResource[], paginationState: PaginationEntityState) => {
          const cfGuid = paginationState.clientPagination.filter.items.cf;
          return entities.filter(e => {
            const validCF = !(cfGuid && cfGuid !== e.entity.cfGuid);
            return validCF;
          });
        }
      ],
      listConfig
    });
  }
}
