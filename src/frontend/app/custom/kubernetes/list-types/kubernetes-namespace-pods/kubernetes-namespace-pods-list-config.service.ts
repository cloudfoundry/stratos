import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../store/app-state';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesNamespaceService } from '../../services/kubernetes-namespace.service';
import { KubernetesPodsListConfigService } from '../kubernetes-pods/kubernetes-pods-list-config.service';
import { KubernetesNamespacePodsDataSource } from './kubernetes-namespace-pods-data-source';
import { KubernetesNodePodsLinkComponent } from '../kubernetes-node-pods/kubernetes-node-pods-link/kubernetes-node-pods-link.component';

@Injectable()
export class KubernetesNamespacePodsListConfigService extends KubernetesPodsListConfigService {
  constructor(
    store: Store<AppState>,
    kubeId: BaseKubeGuid,
    public kubeNamespaceService: KubernetesNamespaceService,
  ) {
    super(store, kubeId);
    this.podsDataSource = new KubernetesNamespacePodsDataSource(store, kubeId, this, kubeNamespaceService);
    this.columns[0] = {
      columnId: 'name', headerCell: () => 'Pod Name',
      cellComponent: KubernetesNodePodsLinkComponent,
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'name'
      },
      cellFlex: '5',
    };
  }

}
