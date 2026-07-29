import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, Injector, OnInit, Signal, effect, signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  IUserFavoritesGroups,
  EndpointModel,
  entityCatalog,
  UserFavoriteManager } from '@stratosui/store';
import { Observable } from 'rxjs';
import { take, filter, map, switchMap } from 'rxjs/operators';

import { EndpointsService } from '../../../core/endpoints.service';
import { HomeShowMode, HomeSortDirection } from '../../../core/dashboard-preferences.service';
import { naturalCompare } from '../../../shared/utils/natural-sort';
import { SessionService } from '../../../core/session.service';
import { DashboardPreferencesService } from '../../../core/dashboard-preferences.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { NoContentMessageComponent } from '../../../shared/components/no-content-message/no-content-message.component';
import { EndpointsMissingComponent } from '../../../shared/components/endpoints-missing/endpoints-missing.component';
import { HomeUrlBannerComponent } from './home-url-banner/home-url-banner.component';
import { HomePageCardLayout } from './../home.types';
import { HomePageEndpointCardComponent } from './home-page-endpoint-card/home-page-endpoint-card.component';
import { EndpointDataRegistry } from '../../../../../cloud-foundry/src/services/endpoint-data/endpoint-data.registry';

const noConnectedMsg = {
  firstLine: 'There are no connected endpoints',
  secondLine: { text: 'Use the Endpoints view to connect'},
  icon: 'settings_ethernet'
};

const noFavoritesMsg = (endpointCount: number, favoriteCount: number) => ({
  firstLine: endpointCount > 0
    ? `You have ${endpointCount} endpoint${endpointCount !== 1 ? 's' : ''} and ${favoriteCount > 0 ? favoriteCount : 'none'} ha${favoriteCount === 1 ? 's' : 've'} been selected to be on your home page.`
    : 'You have no endpoints.',
  secondLine: { text: endpointCount > 0
    ? 'Switch to "Connected" or "All" above to show more endpoints, or star an endpoint to add it here.'
    : 'Use the Endpoints view to register and connect an endpoint.' },
  icon: 'star_outline'
});

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    NoContentMessageComponent,
    EndpointsMissingComponent,
    HomePageEndpointCardComponent,
    HomeUrlBannerComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePageComponent implements OnInit {
  endpointsService = inject(EndpointsService);
  private router = inject(Router);
  private sessionService = inject(SessionService);
  private prefs = inject(DashboardPreferencesService);
  userFavoriteManager = inject(UserFavoriteManager);
  private registry = inject(EndpointDataRegistry);
  private injector = inject(Injector);

  public allEndpointIds$: Observable<string[]>;
  public haveRegistered: Signal<boolean> = toSignal(this.endpointsService.haveRegistered$, { initialValue: false });

  private connectedEndpointsRaw: Signal<EndpointModel[]> = toSignal(this.endpointsService.connectedEndpoints$, { initialValue: [] as EndpointModel[] });
  private disablePersistenceFeatures: Signal<boolean | null> = toSignal(this.endpointsService.disablePersistenceFeatures$, { initialValue: null });
  private allFavorites = toSignal(this.userFavoriteManager.getAllFavorites());

  private connectedEndpoints: Signal<EndpointModel[]> = computed(() =>
    this.haveRegistered() ? this.connectedEndpointsRaw() : []
  );

  // Every registered endpoint, connection state ignored — source for the
  // starred-only view, where a starred endpoint that is down must still show
  // (as a Disconnected card) instead of silently disappearing (#5588).
  private allEndpointsRaw: Signal<EndpointModel[]> = toSignal(
    this.endpointsService.endpoints$.pipe(map(eps => Object.values(eps))),
    { initialValue: [] as EndpointModel[] }
  );

  private allEndpoints: Signal<EndpointModel[]> = computed(() =>
    this.haveRegistered() ? this.allEndpointsRaw() : []
  );

  private sessionDefaultShowMode: Signal<HomeShowMode | null> = computed(() => {
    const c = this.sessionService.config();
    return c ? (c.homeViewShowFavoritesOnly ? 'favorites' : 'connected') : null;
  });

  public resolvedShowMode: Signal<HomeShowMode> = computed(() =>
    this._showMode() ?? this.prefs.homeShowMode() ?? this.sessionDefaultShowMode() ?? 'favorites'
  );

  public endpoints: Signal<EndpointModel[]> = computed(() => {
    const mode = this.resolvedShowMode();
    const fav = this.allFavorites();
    const favGroups: IUserFavoritesGroups = fav ? fav[0] : ({} as IUserFavoritesGroups);
    if (mode === 'favorites') {
      // Every starred endpoint (directly, or via starred child entities)
      // regardless of connection state — a starred endpoint that is down
      // renders as a Disconnected card rather than being hidden (#5588).
      return this.orderEndpoints(this.allEndpoints(), favGroups, false);
    }
    if (mode === 'all') {
      // Every registered endpoint, any state, favorites sorted first.
      return this.orderEndpoints(this.allEndpoints(), favGroups, true);
    }
    const ordered = this.orderEndpoints(this.connectedEndpoints(), favGroups, true);
    return ordered.filter(ep => {
      // strict: cnsi_type is populated on every connected endpoint; '' default keeps the lookup well-formed
      const defn = entityCatalog.getEndpoint(ep.cnsi_type ?? '', ep.sub_type);
      const connected = defn.definition.unConnectable || ep.connectionStatus === 'connected';
      return connected;
    });
  });

  public haveThingsToShow: Signal<boolean> = computed(() => this.endpoints().length > 0);

  private _layout = signal<HomePageCardLayout | null>(null);
  public layout = this._layout.asReadonly();

  private _showMode = signal<HomeShowMode | null>(null);
  private persistedShowMode: HomeShowMode | null = null;

  public columns = 1;

  public layoutID = 0;

  public layouts: HomePageCardLayout[] = [
    new HomePageCardLayout(0, 0, 'Automatic'),
    new HomePageCardLayout(1, 1, 'Single Column'),
    new HomePageCardLayout(1, 2, 'Compact Single Column'),
    new HomePageCardLayout(2, 1, 'Two Column'),
    new HomePageCardLayout(2, 2, 'Compact Two Column'),
    new HomePageCardLayout(3, 2, 'Three Column'),
  ];

  noneAvailableMsg = noFavoritesMsg(0, 0);

  private redirectChecked = false;
  private layoutInitialized = false;

  constructor() {
    // Wait for endpoints to be loaded before creating the endpoint IDs list
    // (PageHeaderComponent currently consumes this as an Observable input)
    this.allEndpointIds$ = this.endpointsService.haveRegistered$.pipe(
      filter(haveRegistered => haveRegistered),
      take(1),
      switchMap(() => this.endpointsService.connectedEndpoints$),
      map(endpoints => Object.values(endpoints)
        .map(endpoint => endpoint.guid)
        .filter((guid): guid is string => !!guid))
    );

    // Redirect to /applications when persistence features are disabled
    effect(() => {
      const off = this.disablePersistenceFeatures();
      if (off === null || this.redirectChecked) {
        return;
      }
      this.redirectChecked = true;
      if (off) {
        this.router.navigate(['applications'], { replaceUrl: true });
      }
    });

    // Apply persisted layout once it has hydrated from localStorage
    effect(() => {
      const layoutId = this.prefs.homeLayout();
      if (this.layoutInitialized) {
        return;
      }
      this.layoutInitialized = true;
      const selected = this.layouts.find(l => l && l.id === layoutId) || this.layouts[0];
      this.onChangeLayout(selected);
    });

    // Persist resolved show-mode and refresh the noneAvailable message
    // whenever it or the endpoint list changes
    effect(() => {
      const mode = this.resolvedShowMode();
      const registered = this.allEndpoints();
      const ordered = this.endpoints();

      if (this.persistedShowMode !== mode) {
        this.persistedShowMode = mode;
        this.prefs.setHomeShowMode(mode);
      }
      this.noneAvailableMsg = mode === 'favorites'
        ? noFavoritesMsg(registered.length, ordered.length)
        : noConnectedMsg;
    });

    // Set an initial layout (the layout-init effect above will replace this once prefs hydrate)
    this._layout.set(this.getLayout(1, 1));
  }

  private concurrencyConfigured = false;

  ngOnInit() {
    // Wire EndpointDataRegistry concurrency from backend session config (one-shot).
    // Each card self-triggers load() in its own ngOnInit; the registry's
    // mergeMap(maxConcurrentCards) throttles the actual HTTP fan-out.
    effect(() => {
      const config = this.sessionService.config();
      if (!config || this.concurrencyConfigured) {
        return;
      }
      const concurrency = (config as { endpointCardConcurrency?: number }).endpointCardConcurrency ?? 0;
      if (concurrency > 0) {
        this.registry.configure(concurrency);
      }
      this.concurrencyConfigured = true;
    }, { injector: this.injector });
  }

  // Header segmented control: Favorites | Connected | All
  public showModes: { value: HomeShowMode, label: string }[] = [
    { value: 'favorites', label: 'Favorites' },
    { value: 'connected', label: 'Connected' },
    { value: 'all', label: 'All' },
  ];

  public setShowMode(mode: HomeShowMode) {
    this._showMode.set(mode);
  }

  // Header name-order control (signal-list card-view sort convention).
  // Applies to the NAME tiebreak only — star grouping and type priority are
  // fixed (decided during #5588 review).
  public sortDirection: Signal<HomeSortDirection> = computed(() => this.prefs.homeSortDirection());

  public toggleSortDirection() {
    this.prefs.setHomeSortDirection(this.sortDirection() === 'asc' ? 'desc' : 'asc');
  }

  // The layout was changed
  public onChangeLayout(layout: HomePageCardLayout) {
    this.layoutID = layout.id;

    // If the layout is automatic, derive from the current endpoint set
    const lo = layout.id === 0 ? this.automaticLayout() : layout;
    this._layout.set(lo);
    this.columns = lo.x;

    // Persist the state
    this.prefs.setHomeLayout(this.layoutID);
  }

  // Order the endpoint cards:
  // 1. Endpoint has been added as a favourite
  // 2. Endpoint that has child favourites
  // 3. Remaining endpoints
  // Within each group, sort by renderPriority (lower = first)
  private orderEndpoints(endpoints: EndpointModel[], favorites: IUserFavoritesGroups, includeRest: boolean): EndpointModel[] {
    const processed: Record<string, boolean> = {};
    const directFavs: EndpointModel[] = [];
    const childFavs: EndpointModel[] = [];
    const rest: EndpointModel[] = [];
    const epMap: Record<string, EndpointModel> = {};
    endpoints.forEach(ep => {
      if (ep.guid) {
        epMap[ep.guid] = ep;
      }
    });

    Object.keys(favorites).forEach(fav => {
      if (!favorites[fav].ethereal) {
        const id = favorites[fav].endpoint.endpointId;
        if (!!epMap[id] && !processed[id]) {
          processed[id] = true;
          directFavs.push(epMap[id]);
        }
      }
    });

    Object.keys(favorites).forEach(fav => {
      if (favorites[fav].ethereal) {
        const id = favorites[fav].endpoint.endpointId;
        if (!!epMap[id] && !processed[id]) {
          processed[id] = true;
          childFavs.push(epMap[id]);
        }
      }
    });

    if (includeRest) {
      endpoints.forEach(ep => {
        if (ep.guid && !processed[ep.guid]) {
          processed[ep.guid] = true;
          rest.push(ep);
        }
      });
    }

    const dir = this.sortDirection();
    const byPriority = (a: EndpointModel, b: EndpointModel) => {
      // strict: cnsi_type is populated on every endpoint; '' default keeps the lookup well-formed
      const pa = entityCatalog.getEndpoint(a.cnsi_type ?? '', a.sub_type)?.definition?.renderPriority ?? 1000;
      const pb = entityCatalog.getEndpoint(b.cnsi_type ?? '', b.sub_type)?.definition?.renderPriority ?? 1000;
      // Same type (priority tie): natural name order, so cf1 < cf2 < cf10
      // instead of the /pp/v1/info payload's arbitrary map order. Direction
      // flips the name comparison only, never the group/type ordering.
      return pa - pb || naturalCompare(a.name, b.name, false, dir);
    };

    return [
      ...directFavs.sort(byPriority),
      ...childFavs.sort(byPriority),
      ...rest.sort(byPriority),
    ];
  }

  // Automatic layout - select the best layout based on the available endpoints
  private automaticLayout(): HomePageCardLayout {
    const eps = this.connectedEndpoints().filter(ep => {
      // strict: cnsi_type is populated on every connected endpoint; '' default keeps the lookup well-formed
      const defn = entityCatalog.getEndpoint(ep.cnsi_type ?? '', ep.sub_type);
      return !!defn.definition.homeCard;
    });

    const wideCount = eps.filter(ep => {
      // strict: cnsi_type is populated on every connected endpoint; '' default keeps the lookup well-formed
      const defn = entityCatalog.getEndpoint(ep.cnsi_type ?? '', ep.sub_type);
      return (defn.definition.homeCard?.columnSpan || 1) > 1;
    }).length;
    const mostlyWide = wideCount > eps.length / 2;

    switch (eps.length) {
      case 1:
        return this.getLayout(1, 1);
      case 2:
        return this.getLayout(1, 2);
      case 3:
      case 4:
        return this.getLayout(2, 2);
      default:
        return this.getLayout(mostlyWide ? 2 : 3, 2);
    }
  }

  private getLayout(x: number, y: number): HomePageCardLayout {
    // strict: every (x, y) callers pass — (1,1) (1,2) (2,2) (3,2) — exists in
    // the hardcoded `layouts` table above, so find always resolves.
    return this.layouts.find(item => item && item.x === x && item.y === y)!;
  }

  // TrackBy functions for optimal change detection
  trackByLayoutId(index: number, layout: HomePageCardLayout): number {
    return layout?.id ?? index;
  }

  trackByEndpointGuid(index: number, endpoint: EndpointModel): string {
    return endpoint?.guid ?? index.toString();
  }

  // Get effective column span for an endpoint, clamped to available columns
  getEffectiveSpan(ep: EndpointModel): number {
    // strict: cnsi_type is populated on every endpoint; '' default keeps the lookup well-formed
    const defn = entityCatalog.getEndpoint(ep.cnsi_type ?? '', ep.sub_type);
    const declared = defn?.definition?.homeCard?.columnSpan || 1;
    return Math.min(declared, this.columns || 1);
  }

  // Layout menu open state. Held here rather than toggled onto the DOM node so
  // the trigger's aria-expanded reflects it.
  public layoutMenuOpen = signal(false);
}
