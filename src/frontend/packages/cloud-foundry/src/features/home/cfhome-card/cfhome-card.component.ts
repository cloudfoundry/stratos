import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter, first, map, pairwise, tap } from 'rxjs/operators';

import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import { EndpointModel } from '../../../../../store/src/public-api';
import { ActionState } from '../../../../../store/src/reducers/api-request-reducer/types';
import { APIResource } from '../../../../../store/src/types/api.types';
import { IApp } from '../../../cf-api.types';
import { CFAppState } from '../../../cf-app-state';
import { cfEntityCatalog } from '../../../cf-entity-catalog';
import { ActiveRouteCfOrgSpace } from '../../cf/cf-page.types';
import { goToAppWall } from '../../cf/cf.helpers';
import { appDataSort, CloudFoundryEndpointService } from '../../cf/services/cloud-foundry-endpoint.service';
import { HomePageCardLayout } from './../../../../../core/src/features/home/home.types';


@Component({
  selector: 'app-cfhome-card',
  templateUrl: './cfhome-card.component.html',
  styleUrls: ['./cfhome-card.component.scss'],
  providers: [
    {
      provide: ActiveRouteCfOrgSpace,
      useValue: null,
    },
    CloudFoundryEndpointService
  ]
})
export class CFHomeCardComponent {

  _layout: HomePageCardLayout;

  get layout(): HomePageCardLayout {
    return this._layout;
  }

  @Input() set layout(value: HomePageCardLayout) {
    if (value) {
      this._layout = value;
    }
    this.updateLayout();
  };

  @Input() set endpoint(value: EndpointModel) {
    this.guid = value.guid;
  }

  guid: string;

  recentAppsRows = 10;

  appLink: () => void;

  appCount$: Observable<number>;
  orgCount$: Observable<number>;
  routeCount$: Observable<number>;

  cardLoaded = false;
  statsLoaded = false;

  private appStatsLoaded = new BehaviorSubject<boolean>(false);
  private appStatsToLoad: APIResource<IApp>[] = [];

  constructor(
    private store: Store<CFAppState>,
    private pmf: PaginationMonitorFactory,
  ) {}

  // Card is instructed to load its view by the container, whn it is visible
  load(): Observable<boolean> {
    this.cardLoaded = true;
    this.routeCount$ = CloudFoundryEndpointService.fetchRouteCount(this.store, this.pmf, this.guid);
    this.appCount$ = CloudFoundryEndpointService.fetchAppCount(this.store, this.pmf, this.guid);
    this.orgCount$ = CloudFoundryEndpointService.fetchOrgs(this.store, this.pmf, this.guid).pipe(map(orgs => orgs.length));

    this.appLink = () => goToAppWall(this.store, this.guid);;

    const appsPagObs = cfEntityCatalog.application.store.getPaginationService(this.guid);

    // When the apps are loaded, fetch the app stats
    appsPagObs.entities$.pipe(first()).subscribe(apps => {
      this.appStatsToLoad = this.restrictApps(apps);
      this.fetchAppStats();
      this.fetchAppStats();
    });

    const appStatLoaded$ = this.appStatsLoaded.asObservable().pipe(filter(loaded => loaded));
    return combineLatest([
      this.routeCount$,
      this.appCount$,
      this.orgCount$,
      appsPagObs.entities$,
      appStatLoaded$
    ]).pipe(
      map(() => true),
      tap(() => { this.statsLoaded = true; })
    );
  }

  public updateLayout() {
    this.recentAppsRows = this.layout.y > 1 ? 5 : 10;

    // Hide recent apps if more than 2 columns
    if (this.layout.x > 2) {
      this.recentAppsRows = 0;
    }
  }

  // Fetch the app stats - we fetch two at a time
  private fetchAppStats() {
    if (this.appStatsToLoad.length > 0) {
      const app = this.appStatsToLoad.shift();
      if (app.entity.state === 'STARTED') {
        cfEntityCatalog.appStats.api.getMultiple(app.metadata.guid, this.guid).pipe(
          map(a => a as ActionState),
          pairwise(),
          filter(([oldR, newR]) => oldR.busy && !newR.busy),
          first()
        ).subscribe(a => {
          this.fetchAppStats();
          this.fetchAppStats();
        });
      } else {
        this.fetchAppStats();
        this.fetchAppStats();
      }
    } else {
      this.appStatsLoaded.next(true);
    }
  }

  private restrictApps(apps: APIResource<IApp>[]): APIResource<IApp>[] {
    if (!apps) {
      return [];
    }
    return [...apps.sort(appDataSort).slice(0, this.recentAppsRows)];
  }

}

