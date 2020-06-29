import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from 'frontend/packages/store/src/app-state';

import { BaseKubernetesPodsListConfigService } from '../../list-types/kubernetes-pods/kubernetes-pods-list-config.service';
import { HelmReleaseHelperService } from '../release/tabs/helm-release-helper.service';
import { HelmReleasePodsDataSource } from './helm-release-pods-list-source';


@Injectable()
export class HelmReleasePodsListConfig extends BaseKubernetesPodsListConfigService {

  constructor(
    store: Store<AppState>,
    helmReleaseHelper: HelmReleaseHelperService
  ) {
    super(
      helmReleaseHelper.endpointGuid,
      [BaseKubernetesPodsListConfigService.namespaceColumnId]
    );
    this.podsDataSource = new HelmReleasePodsDataSource(store, this, helmReleaseHelper.endpointGuid, helmReleaseHelper.releaseTitle);
  }

  private podsDataSource: HelmReleasePodsDataSource;

  hideRefresh = true;

  getDataSource = () => this.podsDataSource;
}
