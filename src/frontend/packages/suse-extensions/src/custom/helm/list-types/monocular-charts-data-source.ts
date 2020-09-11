import { Store } from '@ngrx/store';

import { ListDataSource } from '../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../core/src/shared/components/list/list.component.types';
import { AppState, IRequestEntityTypeState } from '../../../../../store/src/app-state';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { PaginationEntityState } from '../../../../../store/src/types/pagination.types';
import { helmEntityCatalog } from '../helm-entity-catalog';
import { MonocularChart } from '../store/helm.types';

export class MonocularChartsDataSource extends ListDataSource<MonocularChart> {

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<MonocularChart>,
    endpoints: IRequestEntityTypeState<EndpointModel>
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
      transformEntities: [
        { type: 'filter', field: 'name' },
        (entities: MonocularChart[], paginationState: PaginationEntityState) => {
          const repository = paginationState.clientPagination.filter.items.repository;
          if (!repository) {
            return entities;
          }
          return entities.filter(e => e.monocularEndpointId ?
            repository === endpoints[e.monocularEndpointId].name :
            repository === e.attributes.repo.name
          );
        }
      ]
    });
  }
}
