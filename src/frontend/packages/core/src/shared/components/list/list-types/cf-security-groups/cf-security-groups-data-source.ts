import { Store } from '@ngrx/store';

import { cfEntityFactory, securityGroupEntityType } from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { GetAllSecurityGroups } from '../../../../../../../cloud-foundry/src/actions/security-groups-actions';
import { CFAppState } from '../../../../../../../store/src/app-state';
import { endpointSchemaKey } from '../../../../../../../store/src/helpers/entity-factory';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../../store/src/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';

export class CfSecurityGroupsDataSource extends ListDataSource<APIResource> {
  constructor(store: Store<CFAppState>, cfGuid: string, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(endpointSchemaKey, cfGuid);
    const action = new GetAllSecurityGroups(cfGuid, paginationKey);
    super({
      store,
      action,
      schema: cfEntityFactory(securityGroupEntityType),
      getRowUniqueId: getRowMetadata,
      paginationKey,
      isLocal: true,
      transformEntities: [{ type: 'filter', field: 'entity.name' }],
      listConfig
    });
  }
}
