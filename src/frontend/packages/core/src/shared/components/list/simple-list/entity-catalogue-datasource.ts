import { Store } from '@ngrx/store';

import { EntityPipelineEntity } from '../../../../../../store/src/entity-request-pipeline/pipeline.types';
import { StratosBaseCatalogueEntity } from '../../../../core/entity-catalogue/entity-catalogue-entity';
import { ListDataSourceFromActionOrConfig } from '../list-generics/helpers/action-or-config-helpers';
import { ListConfig } from '../list.component.types';

export interface GetMultipleActionConfig {
  endpointGuid?: string;
  paginationKey?: string;
  extraArgs?: Record<any, any>;
}

// TODO: RC Remove

export class CatalogueEntityDrivenListDataSource<T extends EntityPipelineEntity> extends ListDataSourceFromActionOrConfig<T, T> {
  constructor(
    catalogueEntity: StratosBaseCatalogueEntity,
    { endpointGuid, paginationKey = catalogueEntity.entityKey + '-list', extraArgs }: GetMultipleActionConfig,
    store: Store<any>,
    listConfig: ListConfig<T>
  ) {

    super({
      entityConfig: catalogueEntity.getSchema(),
      endpointGuid,
      paginationKey,
      extraArgs
    },
      listConfig,
      store
    );
  }
}
