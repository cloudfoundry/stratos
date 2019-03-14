import { Store } from '@ngrx/store';

import { ListDataSource } from '../../../shared/components/list/data-sources-controllers/list-data-source';
import { AppState } from '../../../../../store/src/app-state';
import { IListConfig } from '../../../shared/components/list/list.component.types';
import { entityFactory } from '../../../../../store/src//helpers/entity-factory';
import { GetMonocularCharts } from '../store/helm.actions';
import { monocularChartsSchemaKey } from '../store/helm.entities';
import { MonocularChart } from '../store/helm.types';
import { PaginationEntityState } from '../../../../../store/src//types/pagination.types';

export class MonocularChartsDataSource extends ListDataSource<MonocularChart> {

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<MonocularChart>
  ) {
    const action = new GetMonocularCharts();
    super({
      store,
      action: action,
      schema: entityFactory(monocularChartsSchemaKey),
      getRowUniqueId: object => object.id,
      paginationKey: action.paginationKey,
      isLocal: true,
      listConfig,
      transformEntities: [{ type: 'filter', field: 'name' },
      (entities: MonocularChart[], paginationState: PaginationEntityState) => {
        const repository = paginationState.clientPagination.filter.items['repository'];
        return entities.filter(e => {
          return !(repository && repository !== e.attributes.repo.name);
        });
      }
      ]
    });
  }
}
