import { Store } from '@ngrx/store';

import {
  type DataFunction,
  type DataFunctionDefinition,
  type IListConfig,
  ListDataSource
} from '@stratosui/core';
import { getPaginationKey } from '../../../../../store/src/actions/pagination.actions';
import type { AppState } from '../../../../../store/src/public-api';
import { kubernetesNodesEntityType } from '../../kubernetes-entity-factory';
import { kubeEntityCatalog } from '../../kubernetes-entity-generator';
import type { BaseKubeGuid } from '../../kubernetes-page.types';
import type { KubernetesNode } from '../../store/kube.types';

export class KubernetesNodesDataSource extends ListDataSource<KubernetesNode> {

  constructor(
    store: Store<AppState>,
    kubeGuid: BaseKubeGuid,
    listConfig: IListConfig<KubernetesNode>,
    transformEntities: (DataFunction<KubernetesNode> | DataFunctionDefinition)[]
  ) {
    const action = kubeEntityCatalog.node.actions.getMultiple(kubeGuid.guid);
    super({
      store,
      action,
      schema: action.entity[0],
      getRowUniqueId: (row) => action.entity[0].getId(row),
      paginationKey: getPaginationKey(kubernetesNodesEntityType, kubeGuid.guid),
      isLocal: true,
      listConfig,
      transformEntities
    });
  }
}
