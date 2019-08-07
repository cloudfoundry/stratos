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
import { PaginationEntityState } from '../../../../../../store/src/types/pagination.types';

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

export class LabelsKubernetesNodesDataSource extends KubernetesNodesDataSource {

  constructor(
    store: Store<AppState>,
    kubeGuid: BaseKubeGuid,
    listConfig: IListConfig<KubernetesNode>
  ) {
    super(
      store,
      kubeGuid,
      listConfig,
      [
        (entities: KubernetesNode[], paginationStore: PaginationEntityState) => {
          const filterString = paginationStore.clientPagination.filter.string.toUpperCase();
          return entities.filter(node => {
            return Object.entries(node.metadata.labels).some(([label, value]) => {
              label = label.toUpperCase();
              value = value.toUpperCase();
              return label.includes(filterString) || value.includes(filterString);
            });
          });
        }
      ]
    );
  }
}

export class NameKubernetesNodesDataSource extends KubernetesNodesDataSource {

  constructor(
    store: Store<AppState>,
    kubeGuid: BaseKubeGuid,
    listConfig: IListConfig<KubernetesNode>
  ) {
    super(
      store,
      kubeGuid,
      listConfig,
      [{ type: 'filter', field: 'metadata.name' }]
    );
  }
}

export class IPAddressKubernetesNodesDataSource extends KubernetesNodesDataSource {

  constructor(
    store: Store<AppState>,
    kubeGuid: BaseKubeGuid,
    listConfig: IListConfig<KubernetesNode>
  ) {
    super(
      store,
      kubeGuid,
      listConfig,
      [
        (entities: KubernetesNode[], paginationState: PaginationEntityState) => {
          return entities.filter(node => {
            const internalIP: string = node.status.addresses.find(address => {
              return address.type === 'InternalIP';
            }).address;
            return internalIP.toUpperCase().includes(paginationState.clientPagination.filter.string.toUpperCase());
          });
        }
      ]
    );
  }
}
