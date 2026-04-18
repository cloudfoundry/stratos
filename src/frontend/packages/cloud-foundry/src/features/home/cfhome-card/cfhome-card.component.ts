import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, inject, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { take, filter, map, pairwise } from 'rxjs/operators';
import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';
import { EndpointDataService } from '../../../services/endpoint-data/endpoint-data.service';

import { BASE_REDIRECT_QUERY } from '@stratosui/core';
import { RouterNav, PaginationMonitorFactory, EndpointModel, ActionState, APIResource } from '@stratosui/store';
import { IApp } from '../../../cf-api.types';
import { CFAppState } from '../../../cf-app-state';
import { cfEntityCatalog } from '../../../cf-entity-catalog';
import {
  ApplicationDeploySourceTypes,
  AUTO_SELECT_DEPLOY_TYPE_ENDPOINT_PARAM,
  AUTO_SELECT_DEPLOY_TYPE_URL_PARAM } from '../../applications/deploy-application/deploy-application-steps.types';
import {
  AUTO_SELECT_CF_URL_PARAM,
  IAppTileData } from '../../applications/new-application-base-step/new-application-base-step.component';
import { ActiveRouteCfOrgSpace } from '../../cf/cf-page.types';
import { goToAppWall } from '../../cf/cf.helpers';
import { appDataSort, CloudFoundryEndpointService } from '../../cf/services/cloud-foundry-endpoint.service';
import { HomePageCardLayout, HomePageEndpointCard, ITileConfig } from '@stratosui/core';
import { TileGridComponent } from '@stratosui/core';
import { TileGroupComponent } from '@stratosui/core';
import { TileComponent } from '@stratosui/core';
import { CardNumberMetricComponent } from '@stratosui/core';
import { CardCfRecentAppsComponent } from '../card-cf-recent-apps/card-cf-recent-apps.component';
import { TileSelectorComponent } from '@stratosui/core';


@Component({
  selector: 'app-cfhome-card',
  templateUrl: './cfhome-card.component.html',
  styleUrls: ['./cfhome-card.component.scss'],
  providers: [
    {
      provide: ActiveRouteCfOrgSpace,
      useValue: null },
    CloudFoundryEndpointService,
    ApplicationDeploySourceTypes,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AsyncPipe,
    TileGridComponent,
    TileGroupComponent,
    TileComponent,
    CardNumberMetricComponent,
    CardCfRecentAppsComponent,
    TileSelectorComponent
  ]
})
export class CFHomeCardComponent implements HomePageEndpointCard, OnDestroy {
  private store = inject<Store<CFAppState>>(Store);
  private pmf = inject(PaginationMonitorFactory);
  private cdr = inject(ChangeDetectorRef);
  private registry = inject(EndpointDataRegistry);

  endpointDataService: EndpointDataService | null = null;


  pLayout!: HomePageCardLayout;

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

  hasNoApps$!: Observable<boolean>;

  cardLoaded = false;

  recentApps: APIResource<IApp>[] = [];

  private appStatsLoaded = new BehaviorSubject<boolean>(false);
  private appStatsToLoad: APIResource<IApp>[] = [];

  public tileSelectorConfig$: Observable<ITileConfig<IAppTileData>[]>;

  showDeployAppTiles = false;

  constructor() {
    const appDeploySourceTypes = inject(ApplicationDeploySourceTypes);

    // Set a default layout
    this.pLayout = new HomePageCardLayout(1, 1);

    // Get source types for if we are showing tiles to deploy an application
    this.tileSelectorConfig$ = appDeploySourceTypes.types$.pipe(
      map(types => types.map(type =>
        new ITileConfig<IAppTileData>(
          type.name,
          type.graphic,
          {
            type: 'deploy',
            subType: type.id,
            endpointGuid: type.endpointGuid
          },
        )
      ))
    );
  }

  // Deploy an app from the Home Card for the given endpoint
  set selectedTile(tile: ITileConfig<IAppTileData>) {
    const type = tile ? tile.data.type : null;
    if (tile) {
      const query: Record<string, string> = {
        [BASE_REDIRECT_QUERY]: `applications/new/${this.guid}`,
        [AUTO_SELECT_CF_URL_PARAM]: this.guid
      };
      if (tile.data.subType) {
        query[AUTO_SELECT_DEPLOY_TYPE_URL_PARAM] = tile.data.subType;
      }
      if (tile.data.endpointGuid) {
        query[AUTO_SELECT_DEPLOY_TYPE_ENDPOINT_PARAM] = tile.data.endpointGuid;
      }
      this.store.dispatch(new RouterNav({ path: `applications/${type}`, query }));
    }
  }

  // Card is instructed to load its view by the container, when it is visible
  load(): Observable<boolean> {
    this.cardLoaded = true;
    this.endpointDataService = this.registry.acquire(this.guid);
    this.cdr.markForCheck();

    this.appLink = () => goToAppWall(this.store, this.guid);

    const appsPagObs = cfEntityCatalog.application.store.getPaginationService(this.guid);

    // When the apps are loaded, fetch the app stats
    this.hasNoApps$ = appsPagObs.entities$.pipe(
      take(1),
      map(apps => {
        this.recentApps = apps;
        this.appStatsToLoad = this.restrictApps(apps);
        // Initiate app stats fetching (recursive method handles batching)
        this.fetchAppStats();
        return apps.length === 0;
      })
    );

    // If data was already fetched (sticky cache hit), complete immediately
    if (this.endpointDataService.lastFetched() !== null) {
      return of(true);
    }

    return new Observable<boolean>(subscriber => {
      const sub = this.endpointDataService!.loaded$.pipe(take(1)).subscribe({
        next: () => { subscriber.next(true); subscriber.complete(); },
        error: () => { subscriber.next(true); subscriber.complete(); },
      });
      return () => sub.unsubscribe();
    });
  }

  ngOnDestroy(): void {
    if (this.endpointDataService) {
      this.registry.release(this.guid);
    }
  }

  public updateLayout() {
    const currentRows = this.recentAppsRows;

    // Hide recent apps if more than 2 columns
    if (this.layout.x > 2) {
      this.recentAppsRows = 0;
    } else if (this.layout.y > 1) {
      this.recentAppsRows = 5;
    } else if (this.layout.x === 2) {
      this.recentAppsRows = 7;
    } else {
      this.recentAppsRows = 10;
    }

    // If the layout changes and there are apps to show then we need to fetch the app stats for them
    if (this.recentAppsRows > currentRows) {
      this.appStatsToLoad = this.restrictApps(this.recentApps);
      this.fetchAppStats();
    }

    // Only show the deploy app tiles in the full view
    this.showDeployAppTiles = this.layout.x === 1 && this.layout.y === 1;

    this.cdr.markForCheck();
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
          take(1)
        ).subscribe(() => {
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
