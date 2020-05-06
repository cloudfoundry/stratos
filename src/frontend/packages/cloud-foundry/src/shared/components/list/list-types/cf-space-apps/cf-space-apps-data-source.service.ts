import { Store } from '@ngrx/store';
import { getRowMetadata } from '@stratos/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { applicationEntityType, spaceEntityType } from '../../../../../../../cloud-foundry/src/cf-entity-types';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { entityCatalog } from '../../../../../../../store/src/entity-catalog/entity-catalog.service';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginatedAction } from '../../../../../../../store/src/types/pagination.types';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { CF_ENDPOINT_TYPE } from '../../../../../cf-types';
import { CloudFoundrySpaceService } from '../../../../../features/cloud-foundry/services/cloud-foundry-space.service';

export class CfSpaceAppsDataSource extends ListDataSource<APIResource> {
  constructor(store: Store<CFAppState>, cfSpaceService: CloudFoundrySpaceService, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(spaceEntityType, cfSpaceService.spaceGuid) + '-tab';
    const appEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, applicationEntityType);
    const actionBuilder = appEntity.actionOrchestrator.getActionBuilder('getAllInSpace');
    const action = actionBuilder(cfSpaceService.spaceGuid, cfSpaceService.cfGuid, paginationKey, [], false, false) as PaginatedAction;
    super({
      store,
      action,
      schema: cfEntityFactory(applicationEntityType),
      getRowUniqueId: getRowMetadata,
      paginationKey,
      isLocal: false,
      transformEntities: [],
      listConfig
    });
  }

}
