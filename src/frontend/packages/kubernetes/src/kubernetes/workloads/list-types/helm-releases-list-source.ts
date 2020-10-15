import { Store } from '@ngrx/store';
import {
  DataFunctionDefinitionType,
  ListDataSource,
} from 'frontend/packages/core/src/shared/components/list/data-sources-controllers/list-data-source';
import {
  extractActualListEntity,
} from 'frontend/packages/core/src/shared/components/list/data-sources-controllers/local-filtering-sorting';
import { IListConfig } from 'frontend/packages/core/src/shared/components/list/list.component.types';
import { AppState } from 'frontend/packages/store/src/app-state';
import { PaginationEntityState } from 'frontend/packages/store/src/types/pagination.types';

import { HelmRelease } from '../workload.types';
import { workloadsEntityCatalog } from '../workloads-entity-catalog';

const kubeEndpointFilter = (entities: HelmRelease[], paginationState: PaginationEntityState) => {
  // Filter by Kube Endpoint and Namespace
  const kubeId = paginationState.clientPagination.filter.items.kubeId;
  const namespace = paginationState.clientPagination.filter.items.namespace;
  return !kubeId && !namespace ? entities : entities.filter(e => {
    e = extractActualListEntity(e);
    const validKubeId = !(kubeId && kubeId !== e.endpointId);
    const validNamespace = !(namespace && namespace !== e.namespace);
    return validKubeId && validNamespace;
  });
};

export class HelmReleasesDataSource extends ListDataSource<HelmRelease> {

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<HelmRelease>
  ) {

    const action = workloadsEntityCatalog.release.actions.getMultiple();
    const transformEntities = [{ type: 'filter' as DataFunctionDefinitionType, field: 'name' }, kubeEndpointFilter];
    super({
      store,
      action,
      schema: action.entity[0],
      getRowUniqueId: row => action.entity[0].getId(row),
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntities,
      listConfig
    });
  }

}
