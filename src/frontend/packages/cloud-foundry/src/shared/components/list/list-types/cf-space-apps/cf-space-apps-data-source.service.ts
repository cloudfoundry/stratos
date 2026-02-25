import { Store } from '@ngrx/store';
import { getRowMetadata, APIResource } from '@stratosui/store';
import { ListDataSource, IListConfig } from '@stratosui/core';

import { CFAppState } from '../../../../../cf-app-state';
import { applicationEntityType, spaceEntityType } from '../../../../../cf-entity-types';
import {
  createEntityRelationPaginationKey,
} from '../../../../../entity-relations/entity-relations.types';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { CloudFoundrySpaceService } from '../../../../../features/cf/services/cloud-foundry-space.service';

export class CfSpaceAppsDataSource extends ListDataSource<APIResource> {
  constructor(store: Store<CFAppState>, cfSpaceService: CloudFoundrySpaceService, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(spaceEntityType, cfSpaceService.spaceGuid) + '-tab';
    const action = cfEntityCatalog.application.actions.getAllInSpace(
      cfSpaceService.spaceGuid,
      cfSpaceService.cfGuid,
      paginationKey,
      [],
      false,
      false
    );
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
