import { Store } from '@ngrx/store';

import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { AppState } from '../../../../../../../store/src/app-state';
import { createEntityRelationPaginationKey } from '../../../../../../../store/src/helpers/entity-relations/entity-relations.types';
import { endpointSchemaKey, entityFactory, securityGroupSchemaKey } from '../../../../../../../store/src/helpers/entity-factory';
import { GetAllSecurityGroups } from '../../../../../../../store/src/actions/security-groups-actions';

export class CfSecurityGroupsDataSource extends ListDataSource<APIResource> {
  constructor(store: Store<AppState>, cfGuid: string, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(endpointSchemaKey, cfGuid);
    const action = new GetAllSecurityGroups(cfGuid, paginationKey);
    super({
      store,
      action,
      schema: entityFactory(securityGroupSchemaKey),
      getRowUniqueId: getRowMetadata,
      paginationKey,
      isLocal: true,
      transformEntities: [{ type: 'filter', field: 'entity.name' }],
      listConfig
    });
  }
}
