import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { entityFactory } from '../../../../../../store/src/helpers/entity-factory';
import { PaginationMonitor } from '../../../../shared/monitors/pagination-monitor';
import { GetHelmReleases } from '../../store/helm.actions';
import { helmReleasesSchemaKey } from '../../store/helm.entities';
import { HelmReleaseGuid, HelmRelease } from '../../store/helm.types';
import { AppState } from './../../../../../../store/src/app-state';
import { getPaginationObservables } from './../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';

@Injectable()
export class HelmReleaseHelperService {

  public isFetching$: Observable<boolean>;

  public release$: Observable<any>;

  public guid: string;

  constructor(
    helmReleaseGuid: HelmReleaseGuid,
    store: Store<AppState>,
  ) {
    this.guid = helmReleaseGuid.guid;

    const action = new GetHelmReleases();
    const paginationMonitor = new PaginationMonitor(store, action.paginationKey, entityFactory(helmReleasesSchemaKey));
    const svc = getPaginationObservables({store, action, paginationMonitor});
    this.isFetching$ = svc.fetchingEntities$;

    this.release$ = svc.entities$.pipe(
      map((items: HelmRelease[]) => items.find(item => item.guid === this.guid))
    );
  }

}
