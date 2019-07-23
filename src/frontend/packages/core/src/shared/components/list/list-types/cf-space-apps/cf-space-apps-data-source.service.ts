import { Store } from '@ngrx/store';

import {
  applicationEntityType,
  cfEntityFactory,
  spaceEntityType,
} from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { GetAllAppsInSpace } from '../../../../../../../cloud-foundry/src/actions/space.actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../../store/src/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { CloudFoundrySpaceService } from '../../../../../features/cloud-foundry/services/cloud-foundry-space.service';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';

export class CfSpaceAppsDataSource extends ListDataSource<APIResource> {
  constructor(store: Store<CFAppState>, cfSpaceService: CloudFoundrySpaceService, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(spaceEntityType, cfSpaceService.spaceGuid) + '-tab';
    const action = new GetAllAppsInSpace(cfSpaceService.cfGuid, cfSpaceService.spaceGuid, paginationKey, [], false, false);
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
