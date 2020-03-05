import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../../../store/src/app-state';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesNodeService } from '../../services/kubernetes-node.service';
import { BaseKubernetesPodsListConfigService } from '../kubernetes-pods/kubernetes-pods-list-config.service';
import { KubernetesNodePodsDataSource } from './kubernetes-node-pods-data-source';

@Injectable()
export class KubernetesNodePodsListConfigService extends BaseKubernetesPodsListConfigService {

  private podsDataSource: KubernetesNodePodsDataSource;

  getDataSource = () => this.podsDataSource;

  constructor(
    store: Store<AppState>,
    kubeId: BaseKubeGuid,
    public kubeNodeService: KubernetesNodeService,
  ) {
    super(kubeId.guid, [
      BaseKubernetesPodsListConfigService.nodeColumnId
    ]);
    this.podsDataSource = new KubernetesNodePodsDataSource(store, kubeId, this, kubeNodeService);
  }

}
