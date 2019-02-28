import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../../store/src/app-state';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesPodsListConfigService } from '../kubernetes-pods/kubernetes-pods-list-config.service';
import { KubernetesNodePodsDataSource } from './kubernetes-node-pods-data-source';
import { KubernetesNodeService } from '../../services/kubernetes-node.service';

@Injectable()
export class KubernetesNodePodsListConfigService extends KubernetesPodsListConfigService {
  constructor(
    store: Store<AppState>,
    kubeId: BaseKubeGuid,
    public kubeNodeService: KubernetesNodeService,
  ) {
    super(store, kubeId);
    this.podsDataSource = new KubernetesNodePodsDataSource(store, kubeId, this, kubeNodeService);
  }

}
