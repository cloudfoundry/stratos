import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy, computed, inject, OnDestroy, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
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
  private registry = inject(EndpointDataRegistry);

  // Set by load(); the template and the derived state below read it.
  readonly endpointDataService = signal<EndpointDataService | null>(null);

  readonly cardLayout = signal(new HomePageCardLayout(1, 1));

  get layout(): HomePageCardLayout { return this.cardLayout(); }

  @Input() set layout(value: HomePageCardLayout) {
    if (value) { this.cardLayout.set(value); }
  }

  @Input() set endpoint(value: EndpointModel) {
    // strict: a registered endpoint always carries a guid; it is only
    // optional on the shared EndpointModel shape.
    this.guid.set(value.guid!);
  }

  // Populated by the @Input endpoint setter the home framework always
  // supplies before load()/template read.
  readonly guid = signal('');
  readonly cardLoaded = computed(() => this.endpointDataService() !== null);
  readonly recentAppsRows = computed(() => {
    const layout = this.cardLayout();
    if (layout.x > 2) {
      return 0;
    } else if (layout.y > 1) {
      return 5;
    } else if (layout.x === 2) {
      return 7;
    }
    return 10;
  });
  readonly showDeployAppTiles = computed(() => this.cardLayout().x === 1 && this.cardLayout().y === 1);

  // Follows the service's recent-apps signal, so the list picks up the app
  // mutators (start/stop, create, delete) without another load().
  private readonly allApps = computed<APIResource<IApp>[]>(() =>
    this.endpointDataService()?.recentApps().map(app => stAppToAPIResource(app)) ?? []);
  readonly allApps$ = toObservable(this.allApps);
  // Only once a load has succeeded: before then appCount is just the default 0.
  readonly hasNoApps = computed(() => {
    const eds = this.endpointDataService();
    return !!eds && eds.lastFetched() !== null && eds.appCount() === 0;
  });
  public tileSelectorConfig$: Observable<ITileConfig<IAppTileData>[]>;

  constructor() {
    const appDeploySourceTypes = inject(ApplicationDeploySourceTypes);
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

  // The selector's (selection) output is typed against the base ITileConfig
  // (and emits null on deselect); the tiles are built in this component with
  // IAppTileData, so the narrowing here is sound.
  set selectedTile(tile: ITileConfig | null) {
    if (tile && tile.data) {
      const data = tile.data as IAppTileData;
      const query: Record<string, string> = {
        [BASE_REDIRECT_QUERY]: `applications/new/${this.guid()}`,
        [AUTO_SELECT_CF_URL_PARAM]: this.guid(),
      };
      if (data.subType) { query[AUTO_SELECT_DEPLOY_TYPE_URL_PARAM] = data.subType; }
      if (data.endpointGuid) { query[AUTO_SELECT_DEPLOY_TYPE_ENDPOINT_PARAM] = data.endpointGuid; }
      this.router.navigate(`applications/${data.type}`.split('/'), { queryParams: query });
    }
  }

  load(): Observable<boolean> {
    const endpointDataService = this.registry.acquire(this.guid());
    this.endpointDataService.set(endpointDataService);

    if (endpointDataService.lastFetched() !== null) {
      return of(true);
    }
    return new Observable<boolean>(subscriber => {
      const sub = endpointDataService.loaded$.pipe(take(1)).subscribe({
        next: () => { subscriber.next(true); subscriber.complete(); },
        error: () => { subscriber.next(true); subscriber.complete(); },
      });
      return () => sub.unsubscribe();
    });
  }

  ngOnDestroy(): void {
    if (this.endpointDataService()) {
      this.registry.release(this.guid());
    }
  }

}
