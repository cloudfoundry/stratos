import { Store } from '@ngrx/store';
import {
  type DataFunctionDefinitionType,
  ListDataSource,
} from '@stratosui/core';
import {
  extractActualListEntity,
} from '@stratosui/core';
import type { IListConfig } from '@stratosui/core';
import type { AppState } from '@stratosui/store';
import type { PaginationEntityState } from '@stratosui/store';

import type { HelmRelease } from '../workload.types';
import { workloadsEntityCatalog } from '../workloads-entity-catalog';

const kubeEndpointFilter = (entities: HelmRelease[], paginationState: PaginationEntityState) => {
  // Filter by Kube Endpoint and Namespace
  const kubeId = paginationState.clientPagination.filter.items.kubeId;
  const namespace = paginationState.clientPagination.filter.items.namespace;
  return !kubeId && !namespace ? entities : entities.filter(e => {
    e = extractActualListEntity(e) as HelmRelease;
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
      getRowUniqueId: (row: HelmRelease) => action.entity[0].getId(row),
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntities,
      listConfig
    });
  }

}
