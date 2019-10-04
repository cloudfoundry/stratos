import { ListDataSource } from '../data-sources-controllers/list-data-source';
import { EntityCatalogueEntityConfig, IEntityMetadata } from '../../../../core/entity-catalogue/entity-catalogue.types';
import { Store } from '@ngrx/store';
import { StratosBaseCatalogueEntity } from '../../../../core/entity-catalogue/entity-catalogue-entity';
import { ListConfig, ListViewTypes } from '../list.component.types';
import { ITableColumn } from '../list-table/table.types';
import { createTableColumnFavorite } from '../list-table/table-cell-favorite/table-cell-favorite.component';
import { UserFavorite } from '../../../../../../store/src/types/user-favorites.types';
import { EntityPipelineEntity } from '../../../../../../store/src/entity-request-pipeline/pipeline.types';

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
    const schema = catalogueEntity.getSchema();
    const getAllActionBuilder = catalogueEntity.actionOrchestrator.getActionBuilder('getMultiple');
    if (!getAllActionBuilder) {
      throw Error(`List Error: ${catalogueEntity.entityKey} has no action builder for the getMultiple action.`);
    }
    const listConfig = new ListConfig<T>();
    listConfig.viewType = ListViewTypes.TABLE_ONLY;
    listConfig.isLocal = true;
    listConfig.enableTextFilter = true;
    listConfig.text = {
      title: catalogueEntity.definition.labelPlural,
      noEntries: `There are no ${catalogueEntity.definition.labelPlural.toLowerCase()}`
    };
    listConfig.getColumns = () => {
      const linBuilders = catalogueEntity.builders.entityBuilder.getLines ? catalogueEntity.builders.entityBuilder.getLines() : [];
      return [
        ...linBuilders.map((builder, i) => ({
          columnId: builder[0],
          cellDefinition: {
            getLink: (e: any) => {
              const metaData = catalogueEntity.builders.entityBuilder.getMetadata(e);
              return catalogueEntity.builders.entityBuilder.getLink ? catalogueEntity.builders.entityBuilder.getLink(metaData) : null;
            },
            getValue: (e: any) => {
              const metaData = catalogueEntity.builders.entityBuilder.getMetadata(e);
              return builder[1](metaData);
            }
          },
          headerCell: () => builder[0],
        })),
        createTableColumnFavorite(row => {
          return new UserFavorite(
            // TODO we need a reliable way to get the endpoint guid for any entity
            row.__stratosEndpointGuid__,
            catalogueEntity.endpointType,
            catalogueEntity.definition.type,
            catalogueEntity.getGuidFromEntity(row),
          );
        })
      ];
    };
    listConfig.getDataSource = () => this;
    super({
      store,
      action: getAllActionBuilder(endpointGuid, paginationKey, extraArgs),
      paginationKey,
      schema,
      getRowUniqueId: entity => catalogueEntity.getGuidFromEntity(entity),
      listConfig,
      isLocal: true
    });
    this.listConfig = listConfig;
  }
}
