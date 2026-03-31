import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../../store/src/public-api';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesNodeService } from '../../services/kubernetes-node.service';
import { BaseKubernetesPodsListConfigService } from '../kubernetes-pods/kubernetes-pods-list-config.service';
import { KubernetesNodePodsDataSource } from './kubernetes-node-pods-data-source';

@Injectable({
  providedIn: 'root'
})
export class KubernetesNodePodsListConfigService extends BaseKubernetesPodsListConfigService {
  kubeNodeService = inject(KubernetesNodeService);


  private podsDataSource: KubernetesNodePodsDataSource;

  getDataSource = () => this.podsDataSource;

  constructor() {
    const store = inject<Store<AppState>>(Store);
    const kubeId = inject(BaseKubeGuid);

    super([BaseKubernetesPodsListConfigService.nodeColumnId]);
    const kubeNodeService = this.kubeNodeService;

    this.podsDataSource = new KubernetesNodePodsDataSource(store, kubeId, this, kubeNodeService);
  }

}
