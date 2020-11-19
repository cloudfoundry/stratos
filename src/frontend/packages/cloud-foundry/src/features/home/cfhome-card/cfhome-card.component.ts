import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter, first, map, pairwise } from 'rxjs/operators';

import { BASE_REDIRECT_QUERY } from '../../../../../core/src/shared/components/stepper/stepper.types';
import { RouterNav } from '../../../../../store/src/actions/router.actions';
import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import { EndpointModel } from '../../../../../store/src/public-api';
import { ActionState } from '../../../../../store/src/reducers/api-request-reducer/types';
import { APIResource } from '../../../../../store/src/types/api.types';
import { IApp } from '../../../cf-api.types';
import { CFAppState } from '../../../cf-app-state';
import { cfEntityCatalog } from '../../../cf-entity-catalog';
import { SourceType } from '../../../store/types/deploy-application.types';
import {
  ApplicationDeploySourceTypes,
  AUTO_SELECT_DEPLOY_TYPE_URL_PARAM,
} from '../../applications/deploy-application/deploy-application-steps.types';
import {
  AUTO_SELECT_CF_URL_PARAM,
  IAppTileData,
} from '../../applications/new-application-base-step/new-application-base-step.component';
import { ActiveRouteCfOrgSpace } from '../../cf/cf-page.types';
import { goToAppWall } from '../../cf/cf.helpers';
import { appDataSort, CloudFoundryEndpointService } from '../../cf/services/cloud-foundry-endpoint.service';
import { HomePageCardLayout, HomePageEndpointCard } from './../../../../../core/src/features/home/home.types';
import { ITileConfig } from './../../../../../core/src/shared/components/tile/tile-selector.types';


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
export class CFHomeCardComponent implements HomePageEndpointCard {

  pLayout: HomePageCardLayout;

  get layout(): HomePageCardLayout {
    return this.pLayout;
  }

  @Input() set layout(value: HomePageCardLayout) {
    if (value) {
      this.pLayout = value;
    }
    this.updateLayout();
  }

  @Input() set endpoint(value: EndpointModel) {
    this.guid = value.guid;
  }

  guid: string;

  recentAppsRows = 10;

  appLink: () => void;

  appCount$: Observable<number>;
  orgCount$: Observable<number>;
  routeCount$: Observable<number>;

  hasNoApps$: Observable<boolean>;

  cardLoaded = false;

  recentApps = [];

  private appStatsLoaded = new BehaviorSubject<boolean>(false);
  private appStatsToLoad: APIResource<IApp>[] = [];

  private sourceTypes: SourceType[];
  public tileSelectorConfig: ITileConfig<IAppTileData>[];

  showDeployAppTiles = false;

  constructor(
    private store: Store<CFAppState>,
    private pmf: PaginationMonitorFactory,
    appDeploySourceTypes: ApplicationDeploySourceTypes,
  ) {
    // Set a default layout
    this.pLayout = new HomePageCardLayout(1, 1);

    // Get source types for if we are showing tiles to deploy an application
    this.sourceTypes = appDeploySourceTypes.getTypes();
    this.tileSelectorConfig = [
      ...this.sourceTypes.map(type =>
        new ITileConfig<IAppTileData>(
          type.name,
          type.graphic,
          { type: 'deploy', subType: type.id },
        )
      )
    ];
  }

  // Deploy an app from the Home Card for the given endpoint
  set selectedTile(tile: ITileConfig<IAppTileData>) {
    const type = tile ? tile.data.type : null;
    if (tile) {
      const query = {
        [BASE_REDIRECT_QUERY]: `applications/new/${this.guid}`,
        [AUTO_SELECT_CF_URL_PARAM]: this.guid
      };
      if (tile.data.subType) {
        query[AUTO_SELECT_DEPLOY_TYPE_URL_PARAM] = tile.data.subType;
      }
      this.store.dispatch(new RouterNav({ path: `applications/${type}`, query }));
    }
  }

  // Card is instructed to load its view by the container, whn it is visible
  load(): Observable<boolean> {
    this.cardLoaded = true;
    this.routeCount$ = CloudFoundryEndpointService.fetchRouteCount(this.store, this.pmf, this.guid);
    this.appCount$ = CloudFoundryEndpointService.fetchAppCount(this.store, this.pmf, this.guid);
    this.orgCount$ = CloudFoundryEndpointService.fetchOrgCount(this.store, this.pmf, this.guid);

    this.appLink = () => goToAppWall(this.store, this.guid);

    const appsPagObs = cfEntityCatalog.application.store.getPaginationService(this.guid);

    // When the apps are loaded, fetch the app stats
    this.hasNoApps$ = appsPagObs.entities$.pipe(first(), map(apps => {
      this.recentApps = apps;
      this.appStatsToLoad = this.restrictApps(apps);
      this.fetchAppStats();
      this.fetchAppStats();
      return apps.length === 0;
    }));

    const appStatLoaded$ = this.appStatsLoaded.asObservable().pipe(filter(loaded => loaded));
    return combineLatest([
      this.routeCount$,
      this.appCount$,
      this.orgCount$,
      appsPagObs.entities$,
      appStatLoaded$
    ]).pipe(
      map(() => true)
    );
  }

  public updateLayout() {
    const currentRows = this.recentAppsRows;
    this.recentAppsRows = this.layout.y > 1 ? 5 : 10;

    // Hide recent apps if more than 2 columns
    if (this.layout.x > 2) {
      this.recentAppsRows = 0;
    }

    // If the layout changes and there are apps to show then we need to fetch the app stats for them
    if (this.recentAppsRows > currentRows) {
      this.appStatsToLoad = this.restrictApps(this.recentApps);
      this.fetchAppStats();
    }

    // Only show the deploy app tiles in the full view
    this.showDeployAppTiles = this.layout.x === 1 && this.layout.y === 1;
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
        });
      } else {
        this.fetchAppStats();
      }
    } else {
      this.appStatsLoaded.next(true);
    }
  }

  private restrictApps(apps: APIResource<IApp>[]): APIResource<IApp>[] {
    return !apps ? [] : [...apps.sort(appDataSort).slice(0, this.recentAppsRows)];
  }
}
