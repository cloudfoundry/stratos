import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { EntityServiceFactory } from '../../../../../../store/src/entity-service-factory.service';
import { PaginationMonitor } from '../../../../../../store/src/monitors/pagination-monitor';
import { helmEntityFactory, helmReleaseEntityKey } from '../../helm-entity-factory';
import { GetHelmReleases, GetHelmReleaseStatus, GetHelmReleaseGraph, GetHelmReleaseResource } from '../../store/helm.actions';
import { HelmRelease, HelmReleaseGuid, HelmReleaseStatus, HelmReleaseGraph, HelmReleaseResource } from '../../store/helm.types';
import { AppState } from './../../../../../../store/src/app-state';
import {
  getPaginationObservables,
} from './../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';

@Injectable()
export class HelmReleaseHelperService {

  public isFetching$: Observable<boolean>;

  public release$: Observable<HelmRelease>;

  public guid: string;
  public endpointGuid: string;
  public namespace: string;
  public releaseTitle: string;

  constructor(
    helmReleaseGuid: HelmReleaseGuid,
    store: Store<AppState>,
    private esf: EntityServiceFactory
  ) {
    this.guid = helmReleaseGuid.guid;
    this.releaseTitle = this.guid.split(':')[2];
    this.namespace = this.guid.split(':')[1];
    this.endpointGuid = this.guid.split(':')[0];

    const action = new GetHelmReleases();
    const paginationMonitor = new PaginationMonitor(store, action.paginationKey, helmEntityFactory(helmReleaseEntityKey));
    const svc = getPaginationObservables({ store, action, paginationMonitor });
    this.isFetching$ = svc.fetchingEntities$;

    this.release$ = svc.entities$.pipe(
      map((items: HelmRelease[]) => items.find(item => item.guid === this.guid)),
      map((item: HelmRelease) => {
        if (!item.chart.metadata.icon) {
          const copy = JSON.parse(JSON.stringify(item));
          copy.chart.metadata.icon = '/core/assets/custom/app_placeholder.svg';
          return copy;
        }
        return item;
      })
    );
  }

  public guidAsUrlFragment(): string {
    return this.guid.replace(':', '/').replace(':', '/');
  }

  public fetchReleaseStatus(): Observable<HelmReleaseStatus> {
    // Get helm release
    const action = new GetHelmReleaseStatus(this.endpointGuid, this.releaseTitle);

    return this.esf.create<HelmReleaseStatus>(action.key, action).waitForEntity$.pipe(
      map(entity => entity.entity)
    );
  }

  public fetchReleaseGraph(): Observable<HelmReleaseGraph> {
    // Get helm release
    const action = new GetHelmReleaseGraph(this.endpointGuid, this.releaseTitle);
    return this.esf.create<HelmReleaseGraph>(action.key, action).waitForEntity$.pipe(
      map(entity => entity.entity)
    );
  }

  public fetchReleaseResources(): Observable<HelmReleaseResource> {
    // Get helm release
    const action = new GetHelmReleaseResource(this.endpointGuid, this.releaseTitle);
    return this.esf.create<HelmReleaseResource>(action.key, action).waitForEntity$.pipe(
      map(entity => entity.entity)
    );
  }
}
