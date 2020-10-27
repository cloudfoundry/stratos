import { Store } from '@ngrx/store';
import { EntityCatalogEntityConfig } from 'frontend/packages/store/src/entity-catalog/entity-catalog.types';

import {
  StratosBaseCatalogEntity,
} from '../../../../../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { entityCatalog } from '../../../../../../../store/src/public-api';
import { isPaginatedAction, PaginatedAction } from '../../../../../../../store/src/types/pagination.types';
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
  entityConfig: EntityCatalogEntityConfig;
}

function actionFromConfig(config: ListEntityConfig): PaginatedAction {
  const catalogEntity = entityCatalog.getEntity(config.entityConfig);
  const getAllActionBuilder = catalogEntity.actionOrchestrator.getActionBuilder('getMultiple');
  if (!getAllActionBuilder) {
    throw Error(`List Error: ${catalogEntity.entityKey} has no action builder for the getMultiple action.`);
  }
  return getAllActionBuilder(config.endpointGuid, config.paginationKey, config.extraArgs);
}

/* tslint:disable:no-use-before-declare  */
export class ListDataSourceFromActionOrConfig<A, T> extends ListDataSource<T, A> {
  constructor(
    actionOrConfig: ListActionOrConfig,
    listConfig: IListConfig<T>,
    store: Store<any>,
    dataSourceConfig?: Partial<IListDataSourceConfig<A, T>>
  ) {
    const { action, catalogEntity } = ListActionOrConfigHelpers.createListAction(actionOrConfig);
    super({
      store,
      action,
      paginationKey: action.paginationKey,
      schema: catalogEntity.getSchema(action.schemaKey),
      getRowUniqueId: entity => catalogEntity.getGuidFromEntity(entity),
      listConfig,
      isLocal: true, // assume true unless overwritten
      ...dataSourceConfig
    });
  }
}
/* tslint:enable */

export class ListActionOrConfigHelpers {
  static createListAction(actionOrConfig: ListActionOrConfig): {
    action: PaginatedAction,
    catalogEntity: StratosBaseCatalogEntity;
  } {
    const action = isPaginatedAction(actionOrConfig) || actionFromConfig(actionOrConfig as ListEntityConfig);
    const catalogEntity = entityCatalog.getEntity(action);
    action.paginationKey = action.paginationKey || catalogEntity.entityKey + '-list';
    return {
      action,
      catalogEntity
    };
  }

  static createDataSourceConfig<A, T>(
    store: Store<any>,
    actionOrConfig: ListActionOrConfig,
    listConfig: IListConfig<T>,
    dsOverrides?: Partial<IListDataSourceConfig<A, T>>
  ): IListDataSourceConfig<A, T> {
    const { action, catalogEntity } = ListActionOrConfigHelpers.createListAction(actionOrConfig);
    return {
      store,
      action,
      paginationKey: action.paginationKey,
      schema: catalogEntity.getSchema(action.schemaKey),
      getRowUniqueId: entity => catalogEntity.getGuidFromEntity(entity),
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
