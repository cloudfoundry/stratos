import { Store } from '@ngrx/store';

import { cfEntityFactory, stackEntityType } from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { GetAllStacks } from '../../../../../../../cloud-foundry/src/actions/stack.action';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { entityCatalogue } from '../../../../../core/entity-catalogue/entity-catalogue.service';
import { CF_ENDPOINT_TYPE } from '../../../../../../../cloud-foundry/cf-types';

export class CfStacksDataSource extends ListDataSource<APIResource> {
  constructor(store: Store<CFAppState>, cfGuid: string, listConfig?: IListConfig<APIResource>) {
    const spaceEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, stackEntityType);
    const getAllStacksActionBuilder = spaceEntity.actionOrchestrator.getActionBuilder('getMultiple');
    //TODO kate
    const action = getAllStacksActionBuilder(cfGuid);  
    super({
      store,
      action,
      schema: cfEntityFactory(stackEntityType),
      getRowUniqueId: getRowMetadata,
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntities: [{ type: 'filter', field: 'entity.name' }],
      listConfig
    });
  }
}
