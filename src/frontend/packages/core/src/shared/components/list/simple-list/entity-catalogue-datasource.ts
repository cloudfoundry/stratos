import { ListDataSource } from '../data-sources-controllers/list-data-source';
import { Store } from '@ngrx/store';
import { StratosBaseCatalogueEntity } from '../../../../core/entity-catalogue/entity-catalogue-entity';
import { ListConfig, ListViewTypes } from '../list.component.types';
import { createTableColumnFavorite } from '../list-table/table-cell-favorite/table-cell-favorite.component';
import { UserFavorite } from '../../../../../../store/src/types/user-favorites.types';
import { EntityPipelineEntity, } from '../../../../../../store/src/entity-request-pipeline/pipeline.types';

export interface GetMultipleActionConfig {
  endpointGuid?: string;
  paginationKey?: string;
  extraArgs?: Record<any, any>;
}
export class CatalogueEntityDrivenListDataSource<T extends EntityPipelineEntity> extends ListDataSource<T> {
  public listConfig: ListConfig<T>;
  constructor(
    catalogueEntity: StratosBaseCatalogueEntity,
    { endpointGuid, paginationKey = catalogueEntity.entityKey + '-list', extraArgs }: GetMultipleActionConfig,
    store: Store<any>,
  ) {
    const tableConfig = catalogueEntity.definition.tableConfig;
    const schema = catalogueEntity.getSchema();
    const getAllActionBuilder = catalogueEntity.actionOrchestrator.getActionBuilder('getMultiple');
    if (!getAllActionBuilder) {
      throw Error(`List Error: ${catalogueEntity.entityKey} has no action builder for the getMultiple action.`);
    }
    const listConfig = new ListConfig<T>();
    listConfig.viewType = ListViewTypes.TABLE_ONLY;
    listConfig.isLocal = true;
    listConfig.enableTextFilter = true;
    const title = !tableConfig || tableConfig && tableConfig.showHeader ? catalogueEntity.definition.labelPlural : null;
    listConfig.text = {
      noEntries: `There are no ${catalogueEntity.definition.labelPlural.toLowerCase()}`
    };
    if (title) {
      listConfig.text.title = title;
    }
    listConfig.getColumns = () => {
      const linBuilders = tableConfig ? tableConfig.columnBuilders : [];
      return [
        ...linBuilders.map((builder, i) => (Array.isArray(builder) ? {
          columnId: builder[0],
          cellDefinition: {
            getValue: (e: any) => {
              return builder[1](e, this.store);
            }
          },
          headerCell: () => builder[0],
        } : builder)),
        createTableColumnFavorite(row => {
          return new UserFavorite(
            catalogueEntity.getEndpointGuidFromEntity(row),
            catalogueEntity.endpointType,
            catalogueEntity.definition.type,
            catalogueEntity.getGuidFromEntity(row),
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
      getRowUniqueId: entity => catalogueEntity.getGuidFromEntity(entity),
      listConfig,
      isLocal: true
    });
    this.listConfig = listConfig;
  }
}
