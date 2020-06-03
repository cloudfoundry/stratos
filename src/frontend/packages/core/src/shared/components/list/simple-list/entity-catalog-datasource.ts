import { Store } from '@ngrx/store';

import {
  StratosBaseCatalogEntity,
} from '../../../../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { EntityPipelineEntity } from '../../../../../../store/src/entity-request-pipeline/pipeline.types';
import { UserFavorite } from '../../../../../../store/src/types/user-favorites.types';
import { ListDataSource } from '../data-sources-controllers/list-data-source';
import { createTableColumnFavorite } from '../list-table/table-cell-favorite/table-cell-favorite.component';
import { ListConfig, ListViewTypes } from '../list.component.types';

export interface GetMultipleActionConfig {
  endpointGuid?: string;
  paginationKey?: string;
  extraArgs?: Record<any, any>;
}
export class CatalogEntityDrivenListDataSource<T extends EntityPipelineEntity> extends ListDataSource<T> {
  public listConfig: ListConfig<T>;
  constructor(
    catalogEntity: StratosBaseCatalogEntity,
    { endpointGuid, paginationKey = catalogEntity.entityKey + '-list', extraArgs }: GetMultipleActionConfig,
    store: Store<any>,
  ) {
    const tableConfig = catalogEntity.definition.tableConfig;
    const schema = catalogEntity.getSchema();
    const getAllActionBuilder = catalogEntity.actionOrchestrator.getActionBuilder('getMultiple');
    if (!getAllActionBuilder) {
      throw Error(`List Error: ${catalogEntity.entityKey} has no action builder for the getMultiple action.`);
    }
    const listConfig = new ListConfig<T>();
    listConfig.viewType = ListViewTypes.TABLE_ONLY;
    listConfig.isLocal = true;
    listConfig.enableTextFilter = true;
    const title = !tableConfig || tableConfig && tableConfig.showHeader ? catalogEntity.definition.labelPlural : null;
    listConfig.text = {
      noEntries: `There are no ${catalogEntity.definition.labelPlural.toLowerCase()}`
    };
    if (title) {
      listConfig.text.title = title;
    }
    listConfig.getColumns = () => {
      const linBuilders = tableConfig ? tableConfig.rowBuilders : [];
      return [
        ...linBuilders.map((builder, i) => ({
          columnId: builder[0],
          cellDefinition: {
            getLink: (e: any) => {
              return null;
            },
            getValue: (e: any) => {
              return builder[1](e, this.store);
            }
          },
          headerCell: () => builder[0],
        })),
        createTableColumnFavorite(row => {
          return new UserFavorite(
            catalogEntity.getEndpointGuidFromEntity(row),
            catalogEntity.endpointType,
            catalogEntity.definition.type,
            catalogEntity.getGuidFromEntity(row),
          );
        })
      ];
    };
    listConfig.getDataSource = () => this;
    const action = getAllActionBuilder(endpointGuid, paginationKey, extraArgs);
    super({
      store,
      action,
      paginationKey: action.paginationKey,
      schema,
      getRowUniqueId: entity => catalogEntity.getGuidFromEntity(entity),
      listConfig,
      isLocal: true
    });
    this.listConfig = listConfig;
  }
}
