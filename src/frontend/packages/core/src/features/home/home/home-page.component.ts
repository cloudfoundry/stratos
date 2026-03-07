import { CommonModule } from '@angular/common';
import { ScrollDispatcher } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
  signal,
 } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import {
  IUserFavoritesGroups,
  EndpointModel,
  entityCatalog,
  AuthState,
  RouterNav,
  AppState,
  UserFavoriteManager,
  selectDashboardState,
  SetHomeCardLayoutAction,
  SetDashboardStateValueAction,
  stratosEntityCatalog,
} from '@stratosui/store';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { debounceTime, filter, first, map, startWith, switchMap, tap } from 'rxjs/operators';

import { EndpointsService } from '../../../core/endpoints.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { NoContentMessageComponent } from '../../../shared/components/no-content-message/no-content-message.component';
import { EndpointsMissingComponent } from '../../../shared/components/endpoints-missing/endpoints-missing.component';
import { HomePageCardLayout } from './../home.types';
import { HomePageEndpointCardComponent } from './home-page-endpoint-card/home-page-endpoint-card.component';

const noConnectedMsg = {
  firstLine: 'There are no connected endpoints',
  secondLine: { text: 'Use the Endpoints view to connect'},
  icon: 'settings_ethernet'
};

const noFavoritesMsg = {
  firstLine: 'There are no favorites',
  secondLine: { text: 'Use the Endpoints view to favorite Endpoints'},
  icon: 'star_outline'
};

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
    HomePageEndpointCardComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePageComponent implements AfterViewInit, OnInit, OnDestroy {
  public allEndpointIds$: Observable<string[]>;
  public haveRegistered$: Observable<boolean>;

  public endpoints$: Observable<any>;

  public layouts$: Observable<HomePageCardLayout[]>;

  private _layout = signal<HomePageCardLayout>(null);
  public layout = this._layout.asReadonly();
  public layout$: Observable<HomePageCardLayout>;

  private _showMode = signal<boolean>(null);
  public showAllEndpoints = false;

  public haveThingsToShow$: Observable<boolean>;

  public columns = 1;

  public layoutID = 0;

  private layouts: HomePageCardLayout[] = [
    new HomePageCardLayout(0, 0, 'Automatic'),
    new HomePageCardLayout(1, 1, 'Single Column'),
    new HomePageCardLayout(1, 2, 'Compact Single Column'),
    new HomePageCardLayout(2, 1, 'Two Column'),
    new HomePageCardLayout(2, 2, 'Compact Two Column'),
    new HomePageCardLayout(3, 2, 'Three Column'),
  ];

  noneAvailableMsg = noFavoritesMsg;

  @ViewChild('endpointsPanel', { static: false }) endpointsPanel: ElementRef;
  @ViewChildren(HomePageEndpointCardComponent) endpointCards: QueryList<HomePageEndpointCardComponent>;
  @ViewChildren('endpointElements') endpointElements!: QueryList<ElementRef>;

  notLoadedCardIndices: number[] = [];
  cardsToLoad: HomePageEndpointCardComponent[] = [];
  isLoadingACard = false;

  private viewMonitorSub!: Subscription;
  private cardChangesSub!: Subscription;
  private _checkLayout = signal<boolean>(true);
  private check$ = toObservable(this._checkLayout).pipe(
    filter(v => v),
    debounceTime(100) // Debounce the check signal itself
  );

  constructor(
    public endpointsService: EndpointsService,
    private store: Store<AppState>,
    public userFavoriteManager: UserFavoriteManager,
    private scrollDispatcher: ScrollDispatcher,
  ) {
    // Ensure endpoints are loaded from the backend
    // This is necessary because the home page relies on endpoint data being present in the store
    // Without this, the CF home cards will timeout trying to fetch data
    this.store.dispatch(stratosEntityCatalog.endpoint.actions.getAll(false));

    // Redirect to /applications if not enabled
    endpointsService.disablePersistenceFeatures$.pipe(
      map(off => {
        if (off) {
          store.dispatch(new RouterNav({
            path: ['applications'],
            extras: {
              replaceUrl: true
            }
          }));
        }
      }),
      first()
    ).subscribe();

    this.layouts$ = of(this.layouts);
    this.layout$ = toObservable(this._layout);

    // Wait for endpoints to be loaded before creating the endpoint IDs list
    // This ensures CF data fetches have the endpoint context they need
    this.allEndpointIds$ = this.endpointsService.haveRegistered$.pipe(
      filter(haveRegistered => haveRegistered),
      first(),
      switchMap(() => this.endpointsService.connectedEndpoints$),
      map(endpoints => Object.values(endpoints).map(endpoint => endpoint.guid))
    );
    this.haveRegistered$ = this.endpointsService.haveRegistered$;

    // ZONELESS FIX: Don't block the observable chain when no endpoints are registered
    // The filter was preventing any emissions, which blocked combineLatest from ever firing
    // Now we emit an empty array when no endpoints are registered, allowing the template to render
    const connected$ = this.endpointsService.haveRegistered$.pipe(
      switchMap((haveRegistered) =>
        haveRegistered ? this.endpointsService.connectedEndpoints$ : of([])
      )
    );

    const showMode$ = toObservable(this._showMode);

    // Default value from backend
    const sessionData$ = this.store.select(s => s.auth).pipe(
      filter(auth => !!auth?.sessionData?.config),
      map((auth: AuthState) => auth.sessionData.config.homeViewShowFavoritesOnly),
      map(onlyFavorites => !onlyFavorites)
    );
    // Stored value in local storage
    const showPersistedSetting$ = this.store.select(selectDashboardState).pipe(
      map(dashboardState => dashboardState.homeShowAllEndpoints),
      first()
    );

    // Show Value - current setting then user setting then default from backend
    const combinedShowMode$ = combineLatest([showMode$, showPersistedSetting$, sessionData$]).pipe(
      map(([a, b, c]) => (a !== null) ? a : (b !== null) ? b : c
    ));

    // Only show endpoints that have Home Card metadata
    this.endpoints$ = combineLatest([combinedShowMode$, connected$, userFavoriteManager.getAllFavorites()]).pipe(
      map(([showMode, endpoints, [favGroups, favs]]) => {
        if (this.showAllEndpoints !== showMode) {
          this.showAllEndpoints = showMode;
          // Persist the state
          this.store.dispatch(new SetDashboardStateValueAction('homeShowAllEndpoints', this.showAllEndpoints));
          this.noneAvailableMsg = showMode ? noConnectedMsg : noFavoritesMsg;
        }
        const ordered = this.orderEndpoints(endpoints, favGroups, showMode);
        return ordered.filter(ep => {
          const defn = entityCatalog.getEndpoint(ep.cnsi_type, ep.sub_type);
          const connected = defn.definition.unConnectable || ep.connectionStatus === 'connected';
          return connected;
        });
      })
    );

    this.haveThingsToShow$ = this.endpoints$.pipe(map(eps => eps.length > 0), startWith(true));

    // Set an initial layout
    this._layout.set(this.getLayout(1, 1));

    this.store.select(selectDashboardState).pipe(
      map(dashboardState => dashboardState.homeLayout || 0),
      first()
    ).subscribe(id => {
      const selected = this.layouts.find(hpcl => hpcl && hpcl.id === id) || this.layouts[0];
      this.onChangeLayout(selected);
    });
  }

  ngOnInit() {
    const scroll$ = this.scrollDispatcher.scrolled().pipe(
      map((e: any) => {
        const el = e.elementRef.nativeElement;
        return el.scrollTop;
      }),
      debounceTime(100), // Debounce scroll events
      startWith(0)
    );

    // Load cards as they come into view
    this.viewMonitorSub = combineLatest([scroll$, this.check$]).pipe(
      debounceTime(150) // Reduce debounce time for better responsiveness
    ).subscribe(([scrollTop]) => {
      // Skip if already processing or no cards to check
      if (this.isLoadingACard || this.notLoadedCardIndices.length === 0) {
        return;
      }

      // Reset check signal
      this._checkLayout.set(false);

      // User has scrolled - check the remaining cards that have not been loaded to see if any are now visible
      const remaining: number[] = [];
      const cardsArray = this.endpointElements.toArray();
      const cardsComponentArray = this.endpointCards.toArray();

      // Early exit if arrays are empty or mismatched
      if (cardsArray.length === 0 || cardsComponentArray.length === 0) {
        return;
      }

      const panelParent = this.endpointsPanel?.nativeElement?.offsetParent;
      if (!panelParent) {
        return;
      }

      const height = panelParent.offsetHeight;
      const scrollBottom = scrollTop + height;

      for (const index of this.notLoadedCardIndices) {
        const cardElement = cardsArray[index];
        if (!cardElement) {
          continue;
        }

        const cardTop = cardElement.nativeElement.offsetTop;
        const cardBottom = cardTop + cardElement.nativeElement.offsetHeight;

        // Check if the card is in view - either its top or bottom must be within the visible scroll area
        if ((cardTop >= scrollTop && cardTop <= scrollBottom) || (cardBottom >= scrollTop && cardBottom <= scrollBottom)) {
          const card = cardsComponentArray[index];
          if (card) {
            this.cardsToLoad.push(card);
          }
        } else {
          remaining.push(index);
        }
      }

      this.notLoadedCardIndices = remaining;
      this.processCardsToLoad();
    });
  }

  processCardsToLoad() {
    // Guard against redundant calls
    if (this.isLoadingACard || this.cardsToLoad.length === 0) {
      return;
    }

    const nextCardToLoad = this.cardsToLoad.shift();
    if (nextCardToLoad) {
      this.isLoadingACard = true;
      nextCardToLoad.load();
    }
  }

  ngOnDestroy() {
    if (this.viewMonitorSub) {
      this.viewMonitorSub.unsubscribe();
    }
    if (this.cardChangesSub) {
      this.cardChangesSub.unsubscribe();
    }
  }

  ngAfterViewInit(): void {
    this.cardChangesSub = this.endpointElements.changes.subscribe(cards => this.setCardsToLoad(cards));
    if (this.endpointElements.toArray().length > 0) {
      this.setCardsToLoad(this.endpointElements.toArray());
    }
  }

  setCardsToLoad(cards: ElementRef[]) {
    this.notLoadedCardIndices = [];
    for (let i = 0; i < cards.length; i++) {
      this.notLoadedCardIndices.push(i);
    }
    setTimeout(() => this.checkCardsInView(), 1);
  }

  // This is called after a card has loaded - we call the scroll handler again
  // to check if there are more cards that are visible and thus can be loaded
  cardLoaded() {
    this.isLoadingACard = false;

    // First try to process any cards already in the queue
    this.processCardsToLoad();

    // Only trigger a new check if we have remaining unloaded cards and no cards in the queue
    if (this.notLoadedCardIndices.length > 0 && this.cardsToLoad.length === 0) {
      this.checkCardsInView();
    }
  }

  @HostListener('window:resize')
  onResize() {
    // If we resize the window and make it larger then new cards may come into view
    this.checkCardsInView();
  }

  // Check the cards in view
  checkCardsInView() {
    this._checkLayout.set(true);
  }

  public toggleShowAllEndpoints() {
    this._showMode.set(!this.showAllEndpoints);
  }

  // The layout was changed
  public onChangeLayout(layout: HomePageCardLayout) {
    this.layoutID = layout.id;

    // If the layout is automatic, then adjust based on number of things to show
    const lay$ = layout.id === 0 ? this.automaticLayout() : of(layout);
    lay$.pipe(first()).subscribe(lo => {
      this._layout.set(lo);

      // Update the grid columns based on the layout
      this.columns = lo.x;

      // Persist the state
      this.store.dispatch(new SetHomeCardLayoutAction(this.layoutID));

      // Ensure we check again if any cards are now visible
      // Schedule the check so it happens afer the cards have been laid out
      setTimeout(() => this.checkCardsInView(), 1);
    });
  }

  // Order the endpoint cards - we always show all endpoints, order is:
  // 1. Endpoint has been added as a favourite
  // 2. Endpoint that has child favourites
  // 3. Remaining endpoints
  private orderEndpoints(endpoints: EndpointModel[], favorites: IUserFavoritesGroups, showMode: boolean): EndpointModel[] {
    const processed: Record<string, boolean> = {};
    const result: EndpointModel[] = [];
    const epMap: Record<string, EndpointModel> = {};
    endpoints.forEach(ep => epMap[ep.guid] = ep);

    Object.keys(favorites).forEach(fav => {
      if (!favorites[fav].ethereal) {
        const id = favorites[fav].endpoint.endpointId;
        if (!!epMap[id] && !processed[id]) {
          processed[id] = true;
          result.push(epMap[id]);
        }
      }
    });

    Object.keys(favorites).forEach(fav => {
      if (favorites[fav].ethereal) {
        const id = favorites[fav].endpoint.endpointId;
        if (!!epMap[id] && !processed[id]) {
          processed[id] = true;
          result.push(epMap[id]);
        }
      }
    });

    if (showMode) {
      endpoints.forEach(ep => {
        if (!processed[ep.guid]) {
          processed[ep.guid] = true;
          result.push(ep);
        }
      });
    }

    return result;
  }

  // Automatic layout - select the best layout based on the available endpoints
  private automaticLayout(): Observable<HomePageCardLayout> {
    return this.endpointsService.connectedEndpoints$.pipe(
      map(eps => eps.filter(ep => {
        const defn = entityCatalog.getEndpoint(ep.cnsi_type, ep.sub_type);
        return !!defn.definition.homeCard;
      })),
      map(eps => {
        // Count how many endpoints need wide cards (columnSpan > 1)
        const wideCount = eps.filter(ep => {
          const defn = entityCatalog.getEndpoint(ep.cnsi_type, ep.sub_type);
          return (defn.definition.homeCard?.columnSpan || 1) > 1;
        }).length;

        // If most cards are wide, cap at 2 columns to avoid empty gaps
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
      })
    );
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
