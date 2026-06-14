import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take, startWith } from 'rxjs/operators';
import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';
import { EndpointDataService } from '../../../services/endpoint-data/endpoint-data.service';
import { stAppToAPIResource } from '../../../services/endpoint-data/st-app-adapter';

import { BASE_REDIRECT_QUERY } from '@stratosui/core';
import { EndpointModel, APIResource } from '@stratosui/store';
import { IApp } from '../../../cf-api.types';
import {
  ApplicationDeploySourceTypes,
  AUTO_SELECT_DEPLOY_TYPE_ENDPOINT_PARAM,
  AUTO_SELECT_DEPLOY_TYPE_URL_PARAM } from '../../applications/deploy-application/deploy-application-steps.types';
import {
  AUTO_SELECT_CF_URL_PARAM,
  IAppTileData } from '../../applications/new-application-base-step/new-application-base-step.component';
import { ActiveRouteCfOrgSpace } from '../../cf/cf-page.types';
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
  private router = inject(Router);
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
    // strict: a registered endpoint always carries a guid; it is only
    // optional on the shared EndpointModel shape.
    this.guid = value.guid!;
  }

  // strict: populated by the @Input endpoint setter the home framework
  // always supplies before load()/template read.
  guid!: string;
  recentAppsRows = 10;
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
        // strict: every SourceType emitted by types$ defines a graphic (the
        // base types and the SCM-derived entries all set one); the field is
        // only optional on the shared SourceType interface.
        new ITileConfig<IAppTileData>(type.name, type.graphic!, {
          type: 'deploy',
          subType: type.id,
          ...(type.endpointGuid ? { endpointGuid: type.endpointGuid } : {}),
        })
      ))
    );
  }

  set selectedTile(tile: ITileConfig<IAppTileData>) {
    if (tile && tile.data) {
      const data = tile.data;
      const query: Record<string, string> = {
        [BASE_REDIRECT_QUERY]: `applications/new/${this.guid}`,
        [AUTO_SELECT_CF_URL_PARAM]: this.guid,
      };
      if (data.subType) { query[AUTO_SELECT_DEPLOY_TYPE_URL_PARAM] = data.subType; }
      if (data.endpointGuid) { query[AUTO_SELECT_DEPLOY_TYPE_ENDPOINT_PARAM] = data.endpointGuid; }
      this.router.navigate(`applications/${data.type}`.split('/'), { queryParams: query });
    }
  }

  load(): Observable<boolean> {
    this.cardLoaded = true;
    this.endpointDataService = this.registry.acquire(this.guid);
    this.cdr.markForCheck();

    // afterLoad$ resolves immediately on cache hit, otherwise completes when the
    // parallel native-route fetch finishes. Both allApps$ and hasNoApps$ share it.
    const afterLoad$ = this.afterLoad();
    this.allApps$ = afterLoad$.pipe(
      map(() => this.endpointDataService!.recentApps().map(app => stAppToAPIResource(app))),
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

}
