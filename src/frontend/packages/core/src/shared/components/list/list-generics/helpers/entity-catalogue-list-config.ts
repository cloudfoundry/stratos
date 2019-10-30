import { EntityPipelineEntity } from '../../../../../../../store/src/entity-request-pipeline/pipeline.types';
import { UserFavorite } from '../../../../../../../store/src/types/user-favorites.types';
import { StratosBaseCatalogueEntity } from '../../../../../core/entity-catalogue/entity-catalogue-entity';
import { createTableColumnFavorite } from '../../list-table/table-cell-favorite/table-cell-favorite.component';
import { ListConfig, ListViewTypes } from '../../list.component.types';

export class CatalogueEntityDrivenListConfig<T extends EntityPipelineEntity> extends ListConfig<T> {
  constructor(
    catalogueEntity: StratosBaseCatalogueEntity
  ) {
    super();

    this.viewType = ListViewTypes.TABLE_ONLY;
    this.isLocal = true;
    this.enableTextFilter = true;
    this.text = {
      title: catalogueEntity.definition.labelPlural,
      noEntries: `There are no ${catalogueEntity.definition.labelPlural.toLowerCase()}`
    };
    this.getColumns = () => {
      const linBuilders = catalogueEntity.builders.entityBuilder && catalogueEntity.builders.entityBuilder.getLines ?
        catalogueEntity.builders.entityBuilder.getLines() :
        [];
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
            catalogueEntity.getEndpointGuidFromEntity(row),
            catalogueEntity.endpointType,
            catalogueEntity.definition.type,
            catalogueEntity.getGuidFromEntity(row),
          );
        })
      ];
    };
  }
}
