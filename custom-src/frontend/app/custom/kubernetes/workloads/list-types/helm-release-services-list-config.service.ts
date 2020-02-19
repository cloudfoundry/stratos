import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from 'frontend/packages/store/src/app-state';

import {
  BaseKubernetesServicesListConfig,
} from '../../list-types/kubernetes-services/kubernetes-service-list-config.service';
import { HelmReleaseHelperService } from '../release/tabs/helm-release-helper.service';
import { HelmReleaseServicesDataSource } from './helm-release-services-list-source';

@Injectable()
export class HelmReleaseServicesListConfig extends BaseKubernetesServicesListConfig {

  constructor(
    private store: Store<AppState>,
    public activatedRoute: ActivatedRoute,
    helmReleaseHelper: HelmReleaseHelperService
  ) {
    super();
    this.dataSource = new HelmReleaseServicesDataSource(this.store, this, helmReleaseHelper.endpointGuid, helmReleaseHelper.releaseTitle);
  }
  dataSource: HelmReleaseServicesDataSource;

  hideRefresh = true;

  public getDataSource = () => this.dataSource;
}
