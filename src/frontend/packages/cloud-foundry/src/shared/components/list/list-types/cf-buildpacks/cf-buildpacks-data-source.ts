import { Store } from '@ngrx/store';
import { getRowMetadata } from '@stratos/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { buildpackEntityType } from '../../../../../../../cloud-foundry/src/cf-entity-types';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { entityCatalog } from '../../../../../../../store/src/entity-catalog/entity-catalog.service';
import { endpointSchemaKey } from '../../../../../../../store/src/helpers/entity-factory';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginatedAction } from '../../../../../../../store/src/types/pagination.types';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { CF_ENDPOINT_TYPE } from '../../../../../cf-types';

export class CfBuildpacksDataSource extends ListDataSource<APIResource> {
  constructor(store: Store<CFAppState>, cfGuid: string, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(endpointSchemaKey, cfGuid);
    const buildpackEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, buildpackEntityType);
    const actionBuilder = buildpackEntity.actionOrchestrator.getActionBuilder('getMultiple');
    const action = actionBuilder(cfGuid, paginationKey) as PaginatedAction;
    super({
      store,
      action,
      schema: cfEntityFactory(buildpackEntityType),
      getRowUniqueId: getRowMetadata,
      paginationKey,
      isLocal: true,
      transformEntities: [{ type: 'filter', field: 'entity.name' }],
      listConfig
    });
  }
}
