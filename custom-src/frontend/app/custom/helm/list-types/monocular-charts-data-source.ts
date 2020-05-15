import { Store } from '@ngrx/store';

import { PaginationEntityState } from '../../../../../store/src//types/pagination.types';
import { AppState } from '../../../../../store/src/app-state';
import { ListDataSource } from '../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../shared/components/list/list.component.types';
import { helmEntityCatalog } from '../helm-entity-catalog';
import { MonocularChart } from '../store/helm.types';

export class MonocularChartsDataSource extends ListDataSource<MonocularChart> {

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<MonocularChart>
  ) {
    const action = helmEntityCatalog.chart.actions.getMultiple();
    super({
      store,
      action,
      schema: action.entity[0],
      getRowUniqueId: (row) => action.entity[0].getId(row),
      paginationKey: action.paginationKey,
      isLocal: true,
      listConfig,
      transformEntities: [{ type: 'filter', field: 'name' },
      (entities: MonocularChart[], paginationState: PaginationEntityState) => {
        const repository = paginationState.clientPagination.filter.items.repository;
        return entities.filter(e => {
          return !(repository && repository !== e.attributes.repo.name);
        });
      }
      ]
    });
  }
}
