import { Store } from '@ngrx/store';

import { FetchAllBuildpacks } from '../../../../../../../cloud-foundry/src/actions/buildpack.action';
import { buildpackEntityType, cfEntityFactory } from '../../../../../../../cloud-foundry/src/cf-entity-factory';
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
import { PaginatedAction } from '../../../../../../../store/src/types/pagination.types';

export class CfBuildpacksDataSource extends ListDataSource<APIResource> {
  constructor(store: Store<CFAppState>, cfGuid: string, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(endpointSchemaKey, cfGuid);
    const buildpackEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, buildpackEntityType);
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
