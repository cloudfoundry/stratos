import { Store } from '@ngrx/store';

import type { IListConfig } from '@stratosui/core';
import type { AppState } from '../../../../../store/src/public-api';
import { kubeEntityCatalog } from '../../kubernetes-entity-generator';
import type { BaseKubeGuid } from '../../kubernetes-page.types';
import type { KubeService } from '../../store/kube.types';
import { BaseKubernetesServicesDataSource } from '../kubernetes-services/kubernetes-services-data-source';


export class KubernetesNamespaceServicesDataSource extends BaseKubernetesServicesDataSource {

  constructor(
    store: Store<AppState>,
    kubeGuid: BaseKubeGuid,
    listConfig: IListConfig<KubeService>,
    namespace: string,
  ) {
    super(
      store,
      kubeEntityCatalog.service.actions.getInNamespace(kubeGuid.guid, namespace),
      listConfig
    );
  }

}
