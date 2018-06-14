import { Store } from '@ngrx/store';
import { schema } from 'normalizr';

import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { CloudFoundrySpaceService } from '../../../../../features/cloud-foundry/services/cloud-foundry-space.service';
import { GetAllAppsInSpace } from '../../../../../store/actions/space.actions';
import { AppState } from '../../../../../store/app-state';
import { applicationSchemaKey, entityFactory, spaceSchemaKey } from '../../../../../store/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../../../../store/helpers/entity-relations.types';
import { APIResource } from '../../../../../store/types/api.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';

export class CfSpaceAppsDataSource extends ListDataSource<APIResource> {
  constructor(store: Store<AppState>, cfSpaceService: CloudFoundrySpaceService, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(spaceSchemaKey, cfSpaceService.spaceGuid);
    const action = new GetAllAppsInSpace(cfSpaceService.cfGuid, cfSpaceService.spaceGuid, paginationKey);
    super({
      store,
      action,
      schema: entityFactory(applicationSchemaKey),
      getRowUniqueId: getRowMetadata,
      paginationKey,
      isLocal: true,
      transformEntities: [],
      listConfig
    });
  }

}
