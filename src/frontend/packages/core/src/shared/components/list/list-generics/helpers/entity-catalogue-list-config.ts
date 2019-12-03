import { Store } from '@ngrx/store';

import { EntityPipelineEntity } from '../../../../../../../store/src/entity-request-pipeline/pipeline.types';
import { UserFavorite } from '../../../../../../../store/src/types/user-favorites.types';
import { StratosBaseCatalogueEntity } from '../../../../../core/entity-catalogue/entity-catalogue-entity';
import { createTableColumnFavorite } from '../../list-table/table-cell-favorite/table-cell-favorite.component';
import { ListConfig, ListViewTypes } from '../../list.component.types';

export class CatalogueEntityDrivenListConfig<T extends EntityPipelineEntity> extends ListConfig<T> {
  constructor(
    catalogueEntity: StratosBaseCatalogueEntity,
    store: Store<any>
  ) {
    super();

    const tableConfig = catalogueEntity.definition.tableConfig;
    this.viewType = ListViewTypes.TABLE_ONLY;
    this.isLocal = true;
    this.enableTextFilter = true;
    const title = !tableConfig || tableConfig && tableConfig.showHeader ? catalogueEntity.definition.labelPlural : null;
    this.text = {
      noEntries: `There are no ${catalogueEntity.definition.labelPlural.toLowerCase()}`
    };
    if (title) {
      this.text.title = title;
    }
    this.getColumns = () => {
      const linBuilders = tableConfig ? tableConfig.rowBuilders : [];
      return [
        ...linBuilders.map((builder, i) => ({
          columnId: builder[0],
          cellDefinition: {
            getLink: (e: any) => {
              return null;
            },
            getValue: (e: any) => {
              return builder[1](e, store);
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
