import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from 'frontend/packages/store/src/app-state';
import { EntityServiceFactory } from 'frontend/packages/store/src/entity-service-factory.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { GetHelmRelease, GetHelmReleaseGraph, GetHelmReleaseResource } from '../../store/workloads.actions';
import { HelmRelease, HelmReleaseGraph, HelmReleaseGuid, HelmReleaseResource } from '../../workload.types';


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

    const action = new GetHelmRelease(this.endpointGuid, this.namespace, this.releaseTitle);
    const entityService = this.esf.create<HelmRelease>(action.guid, action);

    this.release$ = entityService.waitForEntity$.pipe(
      map((item) => item.entity),
      map((item: HelmRelease) => {
        if (!item.chart.metadata.icon) {
          const copy = JSON.parse(JSON.stringify(item));
          copy.chart.metadata.icon = '/core/assets/custom/app_placeholder.svg';
          return copy;
        }
        return item;
      })
    );

    this.isFetching$ = entityService.isFetchingEntity$;
  }

  public guidAsUrlFragment(): string {
    return this.guid.replace(':', '/').replace(':', '/');
  }

  public fetchReleaseGraph(): Observable<HelmReleaseGraph> {
    // Get helm release
    const action = new GetHelmReleaseGraph(this.endpointGuid, this.releaseTitle);
    return this.esf.create<HelmReleaseGraph>(action.guid, action).waitForEntity$.pipe(
      map(entity => entity.entity)
    );
  }

  public fetchReleaseResources(): Observable<HelmReleaseResource> {
    // Get helm release
    // TODO: RC --> NWM If this should never be expected to fetch the resource there's a `selectEntity` selector that can be used instead
    // of action
    const action = new GetHelmReleaseResource(this.endpointGuid, this.releaseTitle);
    return this.esf.create<HelmReleaseResource>(action.guid, action).waitForEntity$.pipe(
      map(entity => entity.entity)
    );
  }
}
