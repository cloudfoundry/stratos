import { Store } from '@ngrx/store';

import { AppState } from '../../../../../../store/src/app-state';
import { IListConfig } from '../../../../shared/components/list/list.component.types';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubeService } from '../../store/kube.types';
import { GetKubernetesServicesInNamespace } from '../../store/kubernetes.actions';
import { BaseKubernetesServicesDataSource } from '../kubernetes-services/kubernetes-services-data-source';


export class KubernetesNamespaceServicesDataSource extends BaseKubernetesServicesDataSource {

  constructor(
    store: Store<AppState>,
    kubeGuid: BaseKubeGuid,
    listConfig: IListConfig<KubeService>,
    namespace: string,
  ) {
    const action = new GetKubernetesServicesInNamespace(kubeGuid.guid, namespace);
    super(
      store,
      action,
      listConfig
    );
  }

}
