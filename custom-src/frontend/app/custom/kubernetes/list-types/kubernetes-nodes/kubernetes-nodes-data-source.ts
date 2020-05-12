import { Store } from '@ngrx/store';

import { getPaginationKey } from '../../../../../../store/src/actions/pagination.actions';
import { AppState } from '../../../../../../store/src/app-state';
import {
  DataFunction,
  DataFunctionDefinition,
  ListDataSource,
} from '../../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../shared/components/list/list.component.types';
import { kubernetesNodesEntityType } from '../../kubernetes-entity-factory';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesNode } from '../../store/kube.types';
import { GetKubernetesNodes } from '../../store/kubernetes.actions';

export class KubernetesNodesDataSource extends ListDataSource<KubernetesNode> {

  constructor(
    store: Store<AppState>,
    kubeGuid: BaseKubeGuid,
    listConfig: IListConfig<KubernetesNode>,
    transformEntities: (DataFunction<KubernetesNode> | DataFunctionDefinition)[]
  ) {
    const action = new GetKubernetesNodes(kubeGuid.guid);
    super({
      store,
      action: new GetKubernetesNodes(kubeGuid.guid),
      schema: action.entity[0],
      getRowUniqueId: (row) => action.entity[0].getId(row),
      paginationKey: getPaginationKey(kubernetesNodesEntityType, kubeGuid.guid),
      isLocal: true,
      listConfig,
      transformEntities
    });
  }
}
