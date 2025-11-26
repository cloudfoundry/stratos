import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import type { IListConfig } from '../../../../../core/src/shared/components/list/list.component.types';
import type { AppState } from '../../../../../store/src/public-api';
import type { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesNamespaceService } from '../../services/kubernetes-namespace.service';
import type { KubeService } from '../../store/kube.types';
import { BaseKubernetesServicesListConfig } from '../kubernetes-services/kubernetes-service-list-config.service';
import { KubernetesNamespaceServicesDataSource } from './kubernetes-namespace-services-data-source';

@Injectable({
  providedIn: 'root'
})
export class KubernetesNamespaceServicesListConfig extends BaseKubernetesServicesListConfig implements IListConfig<KubeService> {
  dataSource: KubernetesNamespaceServicesDataSource;

  constructor(
    store: Store<AppState>,
    kubeId: BaseKubeGuid,
    kubeNamespaceService: KubernetesNamespaceService
  ) {
    super();
    this.dataSource = new KubernetesNamespaceServicesDataSource(store, kubeId, this, kubeNamespaceService.namespaceName);
  }
  getDataSource = () => this.dataSource;
}
