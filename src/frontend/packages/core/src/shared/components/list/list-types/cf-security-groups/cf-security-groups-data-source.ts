import { Store } from '@ngrx/store';

import { cfEntityFactory, securityGroupEntityType } from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { GetAllSecurityGroups } from '../../../../../../../cloud-foundry/src/actions/security-groups-actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { endpointSchemaKey } from '../../../../../../../store/src/helpers/entity-factory';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { entityCatalogue } from '../../../../../core/entity-catalogue/entity-catalogue.service';
import { CF_ENDPOINT_TYPE } from '../../../../../../../cloud-foundry/cf-types';

export class CfSecurityGroupsDataSource extends ListDataSource<APIResource> {
  constructor(store: Store<CFAppState>, cfGuid: string, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(endpointSchemaKey, cfGuid);
    const sgEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, securityGroupEntityType);
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
