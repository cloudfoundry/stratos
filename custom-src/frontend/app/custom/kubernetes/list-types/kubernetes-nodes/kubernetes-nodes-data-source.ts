import { Store } from '@ngrx/store';

import { getPaginationKey } from '../../../../../../store/src/actions/pagination.actions';
import { AppState } from '../../../../../../store/src/app-state';
import {
  DataFunction,
  DataFunctionDefinition,
  ListDataSource,
} from '../../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../shared/components/list/list.component.types';
import { kubeEntityCatalog } from '../../kubernetes-entity-catalog';
import { kubernetesNodesEntityType } from '../../kubernetes-entity-factory';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesNode } from '../../store/kube.types';

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
