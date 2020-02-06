import { Store } from '@ngrx/store';

import { GetAllSecurityGroups } from '../../../../../../../cloud-foundry/src/actions/security-groups-actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { securityGroupEntityType } from '../../../../../../../cloud-foundry/src/cf-entity-types';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { endpointSchemaKey } from '../../../../../../../store/src/helpers/entity-factory';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { entityCatalog } from '../../../../../../../store/src/entity-catalog/entity-catalog.service';
import { CF_ENDPOINT_TYPE } from '../../../../../cf-types';

export class CfSecurityGroupsDataSource extends ListDataSource<APIResource> {
  constructor(store: Store<CFAppState>, cfGuid: string, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(endpointSchemaKey, cfGuid);
    const sgEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, securityGroupEntityType);
    const actionBuilder = sgEntity.actionOrchestrator.getActionBuilder('getMultiple');
    const action = actionBuilder(cfGuid, paginationKey);
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
