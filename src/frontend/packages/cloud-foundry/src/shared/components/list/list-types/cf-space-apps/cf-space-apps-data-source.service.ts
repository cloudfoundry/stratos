import { Store } from '@ngrx/store';
import { getRowMetadata, type APIResource, type GeneralEntityAppState } from '@stratosui/store';
import { ListDataSource, type IListConfig } from '@stratosui/core';

import type { CFAppState } from '../../../../../cf-app-state';
import type { IApp } from '../../../../../cf-api.types';
import { applicationEntityType, spaceEntityType } from '../../../../../cf-entity-types';
import {
  createEntityRelationPaginationKey,
} from '../../../../../entity-relations/entity-relations.types';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import type { CloudFoundrySpaceService } from '../../../../../features/cf/services/cloud-foundry-space.service';

export class CfSpaceAppsDataSource extends ListDataSource<APIResource<IApp>> {
  constructor(store: Store<GeneralEntityAppState>, cfSpaceService: CloudFoundrySpaceService, listConfig?: IListConfig<APIResource<IApp>>) {
    const paginationKey = `${createEntityRelationPaginationKey(spaceEntityType, cfSpaceService.spaceGuid)}-tab`;
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
