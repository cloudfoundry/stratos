import { Store } from '@ngrx/store';

import { getPaginationKey } from '../../../../../../store/src/actions/pagination.actions';
import { AppState } from '../../../../../../store/src/app-state';
import { entityFactory } from '../../../../../../store/src/helpers/entity-factory';
import {
  DataFunction,
  DataFunctionDefinition,
  ListDataSource
} from '../../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../shared/components/list/list.component.types';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { getKubeAPIResourceGuid } from '../../store/kube.selectors';
import { KubernetesNode } from '../../store/kube.types';
import { GetKubernetesNodes } from '../../store/kubernetes.actions';
import { kubernetesNodesSchemaKey } from '../../store/kubernetes.entities';

export class KubernetesNodesDataSource extends ListDataSource<KubernetesNode> {

  constructor(
    store: Store<AppState>,
    kubeGuid: BaseKubeGuid,
    listConfig: IListConfig<KubernetesNode>,
    transformEntities: (DataFunction<KubernetesNode> | DataFunctionDefinition)[]
  ) {
    super({
      store,
      action: new GetKubernetesNodes(kubeGuid.guid),
      schema: entityFactory(kubernetesNodesSchemaKey),
      getRowUniqueId: getKubeAPIResourceGuid,
      paginationKey: getPaginationKey(kubernetesNodesSchemaKey, kubeGuid.guid),
      isLocal: true,
      listConfig,
      transformEntities
    });
  }
}
