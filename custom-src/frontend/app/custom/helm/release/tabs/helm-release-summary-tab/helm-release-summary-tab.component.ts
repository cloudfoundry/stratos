import { Component } from '@angular/core';
import { helmReleasesSchemaKey } from '../../../store/helm.entities';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../../../store/src/app-state';
import { GetHelmReleases } from '../../../store/helm.actions';
import { entityFactory } from '../../../../../../../store/src/helpers/entity-factory';
import { PaginationMonitor } from '../../../../../shared/monitors/pagination-monitor';
import { getPaginationObservables } from '../../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { map } from 'rxjs/operators';
import { HelmReleaseGuid, HelmRelease } from '../../../store/helm.types';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-helm-release-summary-tab',
  templateUrl: './helm-release-summary-tab.component.html',
  styleUrls: ['./helm-release-summary-tab.component.scss']
})
export class HelmReleaseSummaryTabComponent {

  isFetching$: Observable<boolean>;

  release$: Observable<any>;

  constructor(
    helmReleaseGuid: HelmReleaseGuid,
    store: Store<AppState>,
  ) {
    const guid = helmReleaseGuid.guid;

    const action = new GetHelmReleases();
    const paginationMonitor = new PaginationMonitor(store, action.paginationKey, entityFactory(helmReleasesSchemaKey));
    const svc = getPaginationObservables({store, action, paginationMonitor});
    this.isFetching$ = svc.fetchingEntities$;

    this.release$ = svc.entities$.pipe(
      map((items: HelmRelease[]) => items.find(item => item.guid === guid))
    );
  }

}
