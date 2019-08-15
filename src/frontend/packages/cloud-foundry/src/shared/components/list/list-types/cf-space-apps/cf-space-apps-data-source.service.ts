import { Store } from '@ngrx/store';

import { GetAllAppsInSpace } from '../../../../../../../cloud-foundry/src/actions/space.actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  applicationEntityType,
  cfEntityFactory,
  spaceEntityType,
} from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { CloudFoundrySpaceService } from '../../../../../features/cloud-foundry/services/cloud-foundry-space.service';

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
