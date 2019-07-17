import { Store } from '@ngrx/store';

import { FetchAllBuildpacks } from '../../../../../../../cloud-foundry/src/actions/buildpack.action';
import { buildpackEntityType, cfEntityFactory } from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { endpointSchemaKey } from '../../../../../../../store/src/helpers/entity-factory';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../../store/src/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';

export class CfBuildpacksDataSource extends ListDataSource<APIResource> {
  constructor(store: Store<CFAppState>, cfGuid: string, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(endpointSchemaKey, cfGuid);
    const action = new FetchAllBuildpacks(cfGuid, paginationKey);
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
