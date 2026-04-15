import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../../store/src/public-api';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesNamespaceService } from '../../services/kubernetes-namespace.service';
import { BaseKubernetesPodsListConfigService } from '../kubernetes-pods/kubernetes-pods-list-config.service';
import { KubernetesNamespacePodsDataSource } from './kubernetes-namespace-pods-data-source';

@Injectable({
  providedIn: 'root'
})
export class KubernetesNamespacePodsListConfigService extends BaseKubernetesPodsListConfigService {

  showNamespaceLink = false;

  private store = inject<Store<AppState>>(Store);
  private kubeId = inject(BaseKubeGuid);
  public kubeNamespaceService = inject(KubernetesNamespaceService);

  constructor() {
    super([BaseKubernetesPodsListConfigService.namespaceColumnId]);
    this.podsDataSource = new KubernetesNamespacePodsDataSource(this.store, this.kubeId, this, this.kubeNamespaceService);
  }

  private podsDataSource: KubernetesNamespacePodsDataSource;

  getDataSource = () => this.podsDataSource;

}
