import { Store } from '@ngrx/store';

import { CF_ENDPOINT_TYPE } from '../../../../../../../cloud-foundry/cf-types';
import { GetAllServices } from '../../../../../../../cloud-foundry/src/actions/service.actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { serviceEntityType } from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { entityCatalogue } from '../../../../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { endpointSchemaKey } from '../../../../../../../store/src/helpers/entity-factory';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginationEntityState } from '../../../../../../../store/src/types/pagination.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';

export class CfServicesDataSource extends ListDataSource<APIResource> {
  constructor(store: Store<CFAppState>, endpointGuid: string, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(endpointSchemaKey);
    super({
      store,
      action: new GetAllServices(paginationKey),
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
