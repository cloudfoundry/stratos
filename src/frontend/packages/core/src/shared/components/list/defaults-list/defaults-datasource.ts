import { Store } from '@ngrx/store';

import { isPaginatedAction, PaginatedAction } from '../../../../../../store/src/types/pagination.types';
import { StratosBaseCatalogueEntity } from '../../../../core/entity-catalogue/entity-catalogue-entity';
import { entityCatalogue } from '../../../../core/entity-catalogue/entity-catalogue.service';
import { EntityCatalogueEntityConfig } from '../../../../core/entity-catalogue/entity-catalogue.types';
import { ListDataSource } from '../data-sources-controllers/list-data-source';
import { IListDataSourceConfig } from '../data-sources-controllers/list-data-source-config';
import { IListConfig } from '../list.component.types';

export type ListDefaultsActionOrConfig = PaginatedAction | ListDefaultsConfig;

export interface ListDefaultsConfig {
  entityConfig: EntityCatalogueEntityConfig;
  endpointGuid?: string;
  paginationKey?: string;
  extraArgs?: Record<any, any>;
}

function actionFromConfig(config: ListDefaultsConfig): PaginatedAction {
  const catalogueEntity = entityCatalogue.getEntity(config.entityConfig);
  const getAllActionBuilder = catalogueEntity.actionOrchestrator.getActionBuilder('getMultiple');
  if (!getAllActionBuilder) {
    throw Error(`List Error: ${catalogueEntity.entityKey} has no action builder for the getMultiple action.`);
  }
  return getAllActionBuilder(config.endpointGuid, config.paginationKey, config.extraArgs);
}

export function createListActionFromActionOrConfig(actionOrConfig: ListDefaultsActionOrConfig): {
  action: PaginatedAction,
  catalogueEntity: StratosBaseCatalogueEntity
} {
  const action = isPaginatedAction(actionOrConfig) || actionFromConfig(actionOrConfig as ListDefaultsConfig);
  const catalogueEntity = entityCatalogue.getEntity(action);
  return {
    action,
    catalogueEntity
  };
}

export class ListDefaultsDataSource<A, T> extends ListDataSource<T, A> {

  constructor(actionOrConfig: ListDefaultsActionOrConfig,
              listConfig: IListConfig<T>,
              store: Store<any>,
              dataSourceConfig?: Partial<IListDataSourceConfig<A, T>>, ) {
    const { action, catalogueEntity } = createListActionFromActionOrConfig(actionOrConfig);
    super({
      store,
      action,
      paginationKey: action.paginationKey,
      schema: catalogueEntity.getSchema(action.schemaKey),
      getRowUniqueId: entity => catalogueEntity.getGuidFromEntity(entity),
      listConfig,
      isLocal: true, // assume true unless overwritten
      ...dataSourceConfig
    });
  }
}
