import { Store } from '@ngrx/store';
import type { Observable } from 'rxjs';

import type {
  StratosBaseCatalogEntity,
} from '../../../../../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import type { EntityPipelineEntity } from '../../../../../../../store/src/entity-request-pipeline/pipeline.types';
import type { GeneralAppState } from '../../../../../../../store/src/app-state';
import { UserFavorite } from '../../../../../../../store/src/types/user-favorites.types';
import { createTableColumnFavorite } from '../../list-table/table-cell-favorite/table-cell-favorite.component';
import { ListConfig, ListViewTypes } from '../../list.component.types';

export class CatalogEntityDrivenListConfig<T extends EntityPipelineEntity> extends ListConfig<T> {
  constructor(
    catalogEntity: StratosBaseCatalogEntity,
    store: Store<GeneralAppState>
  ) {
    super();

    const tableConfig = catalogEntity.definition.tableConfig;
    this.viewType = ListViewTypes.TABLE_ONLY;
    this.isLocal = true;
    this.enableTextFilter = true;
    const title = !tableConfig || tableConfig?.showHeader ? catalogEntity.definition.labelPlural : null;
    this.text = {
      noEntries: `There are no ${catalogEntity.definition.labelPlural.toLowerCase()}`
    };
    if (title) {
      this.text.title = title;
    }
    this.getColumns = () => {
      const linBuilders = tableConfig ? tableConfig.rowBuilders : [];
      return [
        ...linBuilders.map((builder, _i) => ({
          columnId: builder[0],
          cellDefinition: {
            getLink: (_e: T): string | null => {
              return null;
            },
            getValue: (e: T): string | Observable<string> => {
              return builder[1](e, store);
            }
          },
          headerCell: (): string => builder[0],
        })),
        createTableColumnFavorite((row: T) => {
          return new UserFavorite(
            catalogEntity.getEndpointGuidFromEntity(row),
            catalogEntity.endpointType,
            catalogEntity.definition.type,
            catalogEntity.getGuidFromEntity(row),
          );
        })
      ];
    };
  }
}
