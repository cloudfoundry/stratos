import { Store } from '@ngrx/store';

import { GetAllServices } from '../../../../../store/actions/service.actions';
import { AppState } from '../../../../../store/app-state';
import { entityFactory, serviceSchemaKey } from '../../../../../store/helpers/entity-factory';
import { APIResource } from '../../../../../store/types/api.types';
import { PaginationEntityState } from '../../../../../store/types/pagination.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { getPaginationKey } from '../../../../../store/actions/pagination.actions';

export class CfServicesDataSource extends ListDataSource<APIResource> {
  constructor(store: Store<AppState>, endpointGuid: string, listConfig?: IListConfig<APIResource>) {
    const paginationKey = getPaginationKey('cf-services', 'all');
    const action = new GetAllServices(paginationKey);
    super({
      store,
      action,
      schema: entityFactory(serviceSchemaKey),
      getRowUniqueId: (entity: APIResource) => {
        return entity.metadata ? entity.metadata.guid : null;
      },
      paginationKey,
      isLocal: true,
      transformEntities: [
        (entities: APIResource[], paginationState: PaginationEntityState) => {
          const cfGuid = paginationState.clientPagination.filter.items['cf'];
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
