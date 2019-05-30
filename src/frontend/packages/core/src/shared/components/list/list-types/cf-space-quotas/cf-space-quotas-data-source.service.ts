import { Store } from '@ngrx/store';

import { GetOrganizationSpaceQuotaDefinitions } from '../../../../../../../store/src/actions/quota-definitions.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import {
  endpointSchemaKey,
  entityFactory,
  spaceQuotaSchemaKey,
} from '../../../../../../../store/src/helpers/entity-factory';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../../store/src/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';

export class CfOrgSpaceQuotasDataSourceService extends ListDataSource<APIResource> {

  constructor(store: Store<AppState>, orgGuid: string, cfGuid: string, listConfig?: IListConfig<APIResource>) {
    const quotaPaginationKey = createEntityRelationPaginationKey(endpointSchemaKey, cfGuid);
    const action = new GetOrganizationSpaceQuotaDefinitions(quotaPaginationKey, orgGuid, cfGuid);

    super({
      store,
      action,
      schema: entityFactory(spaceQuotaSchemaKey),
      getRowUniqueId: getRowMetadata,
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntities: [{ type: 'filter', field: 'entity.name' }],
      listConfig
    });
  }
}
