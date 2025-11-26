import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import type { AppState } from '../../../../../store/src/public-api';
import type { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesNamespaceService } from '../../services/kubernetes-namespace.service';
import { BaseKubernetesPodsListConfigService } from '../kubernetes-pods/kubernetes-pods-list-config.service';
import { KubernetesNamespacePodsDataSource } from './kubernetes-namespace-pods-data-source';

@Injectable({
  providedIn: 'root'
})
export class KubernetesNamespacePodsListConfigService extends BaseKubernetesPodsListConfigService {

  showNamespaceLink = false;

  constructor(
    store: Store<AppState>,
    kubeId: BaseKubeGuid,
    public kubeNamespaceService: KubernetesNamespaceService,
  ) {
    super([BaseKubernetesPodsListConfigService.namespaceColumnId]);
    this.podsDataSource = new KubernetesNamespacePodsDataSource(store, kubeId, this, kubeNamespaceService);
  }

  private podsDataSource: KubernetesNamespacePodsDataSource;

  getDataSource = () => this.podsDataSource;

}
