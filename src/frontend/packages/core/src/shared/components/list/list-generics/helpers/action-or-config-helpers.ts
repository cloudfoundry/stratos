import { Store } from '@ngrx/store';

import { isPaginatedAction, PaginatedAction } from '../../../../../../../store/src/types/pagination.types';
import { StratosBaseCatalogueEntity } from '../../../../../core/entity-catalogue/entity-catalogue-entity';
import { entityCatalogue } from '../../../../../core/entity-catalogue/entity-catalogue.service';
import { EntityCatalogueEntityConfig } from '../../../../../core/entity-catalogue/entity-catalogue.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListDataSourceConfig } from '../../data-sources-controllers/list-data-source-config';
import { IListConfig } from '../../list.component.types';

export type ListActionOrConfig = PaginatedAction | ListEntityConfig;

interface GetMultipleActionConfig {
  endpointGuid?: string;
  paginationKey?: string;
  extraArgs?: Record<any, any>;
}

export interface ListEntityConfig extends GetMultipleActionConfig {
  entityConfig: EntityCatalogueEntityConfig;
}

function actionFromConfig(config: ListEntityConfig): PaginatedAction {
  const catalogueEntity = entityCatalogue.getEntity(config.entityConfig);
  const getAllActionBuilder = catalogueEntity.actionOrchestrator.getActionBuilder('getMultiple');
  if (!getAllActionBuilder) {
    throw Error(`List Error: ${catalogueEntity.entityKey} has no action builder for the getMultiple action.`);
  }
  return getAllActionBuilder(config.endpointGuid, config.paginationKey, config.extraArgs);
}

export class ListActionOrConfigHelpers {
  static createListAction(actionOrConfig: ListActionOrConfig): {
    action: PaginatedAction,
    catalogueEntity: StratosBaseCatalogueEntity
  } {
    const action = isPaginatedAction(actionOrConfig) || actionFromConfig(actionOrConfig as ListEntityConfig);
    const catalogueEntity = entityCatalogue.getEntity(action);
    action.paginationKey = action.paginationKey || catalogueEntity.entityKey + '-list';
    return {
      action,
      catalogueEntity
    };
  }

  static createDataSourceConfig<A, T>(
    store: Store<any>,
    actionOrConfig: ListActionOrConfig,
    listConfig: IListConfig<T>,
    dsOverrides?: Partial<IListDataSourceConfig<A, T>>
  ): IListDataSourceConfig<A, T> {
    const { action, catalogueEntity } = ListActionOrConfigHelpers.createListAction(actionOrConfig);
    return {
      store,
      action,
      paginationKey: action.paginationKey,
      schema: catalogueEntity.getSchema(action.schemaKey),
      getRowUniqueId: entity => catalogueEntity.getGuidFromEntity(entity),
      listConfig,
      isLocal: true, // assume true unless overwritten
      ...dsOverrides
    };
  }

  static createDataSource<A, T>(
    store: Store<any>,
    actionOrConfig: ListActionOrConfig,
    listConfig: IListConfig<T>,
    dsOverrides?: Partial<IListDataSourceConfig<A, T>>
  ): ListDataSource<T, A> {
    return new ListDataSourceFromActionOrConfig<A, T>(
      actionOrConfig,
      listConfig,
      store,
      dsOverrides
    );

  }
}


export class ListDataSourceFromActionOrConfig<A, T> extends ListDataSource<T, A> {

  constructor(actionOrConfig: ListActionOrConfig,
    listConfig: IListConfig<T>,
    store: Store<any>,
    dataSourceConfig?: Partial<IListDataSourceConfig<A, T>>, ) {
    const { action, catalogueEntity } = ListActionOrConfigHelpers.createListAction(actionOrConfig);
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
