import { ListDataSource } from '../data-sources-controllers/list-data-source';
import { EntityCatalogueEntityConfig, IEntityMetadata } from '../../../../core/entity-catalogue/entity-catalogue.types';
import { Store } from '@ngrx/store';
import { StratosBaseCatalogueEntity } from '../../../../core/entity-catalogue/entity-catalogue-entity';
import { ListConfig, ListViewTypes } from '../list.component.types';
import { ITableColumn } from '../list-table/table.types';

export interface GetMultipleActionConfig {
  endpointGuid?: string;
  paginationKey?: string;
  extraArgs?: Record<any, any>;
}

export class CatalogueEntityDrivenListDataSource<T> extends ListDataSource<T> {
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
      return linBuilders.map((builder, i) => ({
        columnId: builder[0],
        cellDefinition: {
          getValue: (e) => {
            const metaData = catalogueEntity.builders.entityBuilder.getMetadata(e);
            return builder[1](metaData);
          }
        },
        headerCell: () => builder[0],
      }));
    };
    listConfig.getDataSource = () => this;
    super({
      store,
      action: getAllActionBuilder(endpointGuid, paginationKey, extraArgs),
      paginationKey,
      schema,
      getRowUniqueId: entity => schema.getId(entity),
      listConfig,
      isLocal: true
    });
    this.listConfig = listConfig;
  }
}
