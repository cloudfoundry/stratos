import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, inject, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { map, take, startWith } from 'rxjs/operators';
import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';
import { EndpointDataService } from '../../../services/endpoint-data/endpoint-data.service';
import { StApp } from '../../../services/endpoint-data/stratos-types';

import { BASE_REDIRECT_QUERY } from '@stratosui/core';
import { RouterNav, EndpointModel, APIResource } from '@stratosui/store';
import { IApp } from '../../../cf-api.types';
import { CFAppState } from '../../../cf-app-state';
import {
  ApplicationDeploySourceTypes,
  AUTO_SELECT_DEPLOY_TYPE_ENDPOINT_PARAM,
  AUTO_SELECT_DEPLOY_TYPE_URL_PARAM } from '../../applications/deploy-application/deploy-application-steps.types';
import {
  AUTO_SELECT_CF_URL_PARAM,
  IAppTileData } from '../../applications/new-application-base-step/new-application-base-step.component';
import { ActiveRouteCfOrgSpace } from '../../cf/cf-page.types';
import { goToAppWall } from '../../cf/cf.helpers';
import { CloudFoundryEndpointService } from '../../cf/services/cloud-foundry-endpoint.service';
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
    { provide: ActiveRouteCfOrgSpace, useValue: null },
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
    TileSelectorComponent,
  ]
})
export class CFHomeCardComponent implements HomePageEndpointCard, OnDestroy {
  private store = inject<Store<CFAppState>>(Store);
  private cdr = inject(ChangeDetectorRef);
  private registry = inject(EndpointDataRegistry);

  endpointDataService: EndpointDataService | null = null;

  pLayout!: HomePageCardLayout;

  get layout(): HomePageCardLayout { return this.pLayout; }

  @Input() set layout(value: HomePageCardLayout) {
    if (value) { this.pLayout = value; }
    this.updateLayout();
  }

  @Input() set endpoint(value: EndpointModel) {
    this.guid = value.guid;
  }

  guid: string;
  recentAppsRows = 10;
  appLink: () => void;
  hasNoApps$!: Observable<boolean>;
  allApps$!: Observable<APIResource<IApp>[]>;
  cardLoaded = false;
  showDeployAppTiles = false;
  public tileSelectorConfig$: Observable<ITileConfig<IAppTileData>[]>;

  constructor() {
    const appDeploySourceTypes = inject(ApplicationDeploySourceTypes);
    this.pLayout = new HomePageCardLayout(1, 1);
    this.tileSelectorConfig$ = appDeploySourceTypes.types$.pipe(
      map(types => types.map(type =>
        new ITileConfig<IAppTileData>(type.name, type.graphic, {
          type: 'deploy',
          subType: type.id,
          endpointGuid: type.endpointGuid,
        })
      ))
    );
  }

  set selectedTile(tile: ITileConfig<IAppTileData>) {
    if (tile) {
      const query: Record<string, string> = {
        [BASE_REDIRECT_QUERY]: `applications/new/${this.guid}`,
        [AUTO_SELECT_CF_URL_PARAM]: this.guid,
      };
      if (tile.data.subType) { query[AUTO_SELECT_DEPLOY_TYPE_URL_PARAM] = tile.data.subType; }
      if (tile.data.endpointGuid) { query[AUTO_SELECT_DEPLOY_TYPE_ENDPOINT_PARAM] = tile.data.endpointGuid; }
      this.store.dispatch(new RouterNav({ path: `applications/${tile.data.type}`, query }));
    }
  }

  load(): Observable<boolean> {
    this.cardLoaded = true;
    this.endpointDataService = this.registry.acquire(this.guid);
    this.cdr.markForCheck();

    this.appLink = () => goToAppWall(this.store, this.guid);

    // afterLoad$ resolves immediately on cache hit, otherwise completes when the
    // parallel native-route fetch finishes. Both allApps$ and hasNoApps$ share it.
    const afterLoad$ = this.afterLoad();
    this.allApps$ = afterLoad$.pipe(
      map(() => this.endpointDataService!.recentApps().map(app => this.stAppToApiResource(app))),
      startWith([] as APIResource<IApp>[]),
    );
    this.hasNoApps$ = afterLoad$.pipe(
      map(() => this.endpointDataService!.appCount() === 0),
    );

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
    if (this.layout.x > 2) {
      this.recentAppsRows = 0;
    } else if (this.layout.y > 1) {
      this.recentAppsRows = 5;
    } else if (this.layout.x === 2) {
      this.recentAppsRows = 7;
    } else {
      this.recentAppsRows = 10;
    }
    this.showDeployAppTiles = this.layout.x === 1 && this.layout.y === 1;
    this.cdr.markForCheck();
  }

  // Emits once when data is available — immediately on cache hit, after load otherwise.
  private afterLoad(): Observable<void> {
    const svc = this.endpointDataService!;
    return svc.lastFetched() !== null
      ? of(undefined as void)
      : svc.loaded$.pipe(take(1));
  }

  // Maps StApp (from the native parallel fetch) to the minimal APIResource<IApp> shape
  // that CardCfRecentAppsComponent renders. package_state defaults to 'STAGED' — the v3
  // equivalent (droplet state) is not fetched here; noStats=true means live instance
  // counts are not shown, so instances from the web process is sufficient.
  private stAppToApiResource(app: StApp): APIResource<IApp> {
    return {
      metadata: {
        guid: app.guid,
        url: '',
        created_at: app.createdAt,
        updated_at: app.updatedAt,
      },
      entity: {
        name: app.name,
        state: app.state,
        space_guid: app.spaceGuid,
        instances: app.instances,
        package_state: 'STAGED',
      } as IApp,
    };
  }
}
