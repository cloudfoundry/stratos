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
    ? 'Use the layout menu above to show all endpoints, or star an endpoint to add it here.'
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

  private sessionDefaultShowMode: Signal<boolean | null> = computed(() => {
    const c = this.sessionService.config();
    return c ? !c.homeViewShowFavoritesOnly : null;
  });

  private resolvedShowMode: Signal<boolean> = computed(() => {
    const a = this._showMode();
    const b = this.prefs.homeShowAllEndpoints();
    const c = this.sessionDefaultShowMode();
    return (a !== null) ? a : (b !== null) ? b : (c ?? false);
  });

  public endpoints: Signal<EndpointModel[]> = computed(() => {
    const showMode = this.resolvedShowMode();
    const endpoints = this.connectedEndpoints();
    const fav = this.allFavorites();
    const favGroups: IUserFavoritesGroups = fav ? fav[0] : ({} as IUserFavoritesGroups);
    const ordered = this.orderEndpoints(endpoints, favGroups, showMode);
    return ordered.filter(ep => {
      const defn = entityCatalog.getEndpoint(ep.cnsi_type, ep.sub_type);
      const connected = defn.definition.unConnectable || ep.connectionStatus === 'connected';
      return connected;
    });
  });

  public haveThingsToShow: Signal<boolean> = computed(() => this.endpoints().length > 0);

  private _layout = signal<HomePageCardLayout>(null);
  public layout = this._layout.asReadonly();

  private _showMode = signal<boolean>(null);
  public showAllEndpoints = false;

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
      map(endpoints => Object.values(endpoints).map(endpoint => endpoint.guid))
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
      const showMode = this.resolvedShowMode();
      const endpoints = this.connectedEndpoints();
      const ordered = this.endpoints();

      if (this.showAllEndpoints !== showMode) {
        this.showAllEndpoints = showMode;
        this.prefs.setHomeShowAllEndpoints(this.showAllEndpoints);
      }
      const favoriteCount = showMode ? 0 : ordered.length;
      this.noneAvailableMsg = showMode ? noConnectedMsg : noFavoritesMsg(endpoints.length, favoriteCount);
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

  public toggleShowAllEndpoints() {
    this._showMode.set(!this.showAllEndpoints);
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
  private orderEndpoints(endpoints: EndpointModel[], favorites: IUserFavoritesGroups, showMode: boolean): EndpointModel[] {
    const processed: Record<string, boolean> = {};
    const directFavs: EndpointModel[] = [];
    const childFavs: EndpointModel[] = [];
    const rest: EndpointModel[] = [];
    const epMap: Record<string, EndpointModel> = {};
    endpoints.forEach(ep => epMap[ep.guid] = ep);

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

    if (showMode) {
      endpoints.forEach(ep => {
        if (!processed[ep.guid]) {
          processed[ep.guid] = true;
          rest.push(ep);
        }
      });
    }

    const byPriority = (a: EndpointModel, b: EndpointModel) => {
      const pa = entityCatalog.getEndpoint(a.cnsi_type, a.sub_type)?.definition?.renderPriority ?? 1000;
      const pb = entityCatalog.getEndpoint(b.cnsi_type, b.sub_type)?.definition?.renderPriority ?? 1000;
      return pa - pb;
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
      const defn = entityCatalog.getEndpoint(ep.cnsi_type, ep.sub_type);
      return !!defn.definition.homeCard;
    });

    const wideCount = eps.filter(ep => {
      const defn = entityCatalog.getEndpoint(ep.cnsi_type, ep.sub_type);
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
    return this.layouts.find(item => item && item.x === x && item.y === y);
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
    const defn = entityCatalog.getEndpoint(ep.cnsi_type, ep.sub_type);
    const declared = defn?.definition?.homeCard?.columnSpan || 1;
    return Math.min(declared, this.columns || 1);
  }

  // Dropdown menu helpers
  toggleDropdown(button: HTMLElement) {
    const menu = button.nextElementSibling as HTMLElement;
    if (menu) {
      menu.classList.toggle('hidden');
    }
  }

  closeDropdown(button: HTMLElement) {
    const menu = button.nextElementSibling as HTMLElement;
    if (menu) {
      menu.classList.add('hidden');
    }
  }
}
