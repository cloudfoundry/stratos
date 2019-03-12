import { Store } from '@ngrx/store';

import { GetAllServices } from '../../../../../../../store/src/actions/service.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import { endpointSchemaKey, entityFactory, serviceSchemaKey } from '../../../../../../../store/src/helpers/entity-factory';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../../store/src/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginationEntityState } from '../../../../../../../store/src/types/pagination.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';

export class CfServicesDataSource extends ListDataSource<APIResource> {
  constructor(store: Store<AppState>, endpointGuid: string, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(endpointSchemaKey);
    super({
      store,
      action: new GetAllServices(paginationKey),
      schema: entityFactory(serviceSchemaKey),
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
