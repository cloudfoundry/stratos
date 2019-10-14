import { Store } from '@ngrx/store';

import { EntityPipelineEntity } from '../../../../../../store/src/entity-request-pipeline/pipeline.types';
import { StratosBaseCatalogueEntity } from '../../../../core/entity-catalogue/entity-catalogue-entity';
import { ListDefaultsDataSource } from '../defaults-list/defaults-datasource';
import { ListConfig } from '../list.component.types';

export interface GetMultipleActionConfig {
  endpointGuid?: string;
  paginationKey?: string;
  extraArgs?: Record<any, any>;
}

export class CatalogueEntityDrivenListDataSource<T extends EntityPipelineEntity> extends ListDefaultsDataSource<T, T> {
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
