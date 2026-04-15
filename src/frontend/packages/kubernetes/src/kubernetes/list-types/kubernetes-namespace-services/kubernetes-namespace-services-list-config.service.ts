import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { IListConfig } from '../../../../../core/src/shared/components/list/list.component.types';
import { AppState } from '../../../../../store/src/public-api';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesNamespaceService } from '../../services/kubernetes-namespace.service';
import { KubeService } from '../../store/kube.types';
import { BaseKubernetesServicesListConfig } from '../kubernetes-services/kubernetes-service-list-config.service';
import { KubernetesNamespaceServicesDataSource } from './kubernetes-namespace-services-data-source';

@Injectable({
  providedIn: 'root'
})
export class KubernetesNamespaceServicesListConfig extends BaseKubernetesServicesListConfig implements IListConfig<KubeService> {
  dataSource: KubernetesNamespaceServicesDataSource;

  private store = inject<Store<AppState>>(Store);
  private kubeId = inject(BaseKubeGuid);
  private kubeNamespaceService = inject(KubernetesNamespaceService);

  constructor() {
    super();
    this.dataSource = new KubernetesNamespaceServicesDataSource(this.store, this.kubeId, this, this.kubeNamespaceService.namespaceName);
  }
  getDataSource = () => this.dataSource;
}
