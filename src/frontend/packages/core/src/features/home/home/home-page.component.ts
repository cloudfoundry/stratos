import { ScrollDispatcher } from '@angular/cdk/scrolling';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
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
} from '@stratosui/store';
import { BehaviorSubject, combineLatest, Observable, of, Subscription } from 'rxjs';
import { debounceTime, filter, first, map, startWith } from 'rxjs/operators';

import { EndpointsService } from '../../../core/endpoints.service';
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
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements AfterViewInit, OnInit, OnDestroy {
  public allEndpointIds$: Observable<string[]>;
  public haveRegistered$: Observable<boolean>;

  public endpoints$: Observable<any>;

  public layouts$: Observable<HomePageCardLayout[]>;

  private layout = new BehaviorSubject<HomePageCardLayout>(null);
  public layout$: Observable<HomePageCardLayout>;

  private showMode = new BehaviorSubject<boolean>(null);
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

  @ViewChild('endpointsPanel') endpointsPanel;
  @ViewChildren(HomePageEndpointCardComponent) endpointCards: QueryList<HomePageEndpointCardComponent>;
  @ViewChildren('endpointCard') endpointElements: QueryList<ElementRef>;

  notLoadedCardIndices: number[] = [];
  cardsToLoad: HomePageEndpointCardComponent[] = [];
  isLoadingACard = false;

  private viewMonitorSub: Subscription;
  private cardChangesSub: Subscription;
  private checkLayout = new BehaviorSubject<boolean>(true);

  constructor(
    public endpointsService: EndpointsService,
    private store: Store<AppState>,
    public userFavoriteManager: UserFavoriteManager,
    private scrollDispatcher: ScrollDispatcher,
  ) {
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
    this.layout$ = this.layout.asObservable();
    this.allEndpointIds$ = this.endpointsService.connectedEndpoints$.pipe(
      map(endpoints => Object.values(endpoints).map(endpoint => endpoint.guid))
    );
    this.haveRegistered$ = this.endpointsService.haveRegistered$;
    const connected$ = this.endpointsService.connectedEndpoints$;
    const showMode$ = this.showMode.asObservable();

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
    this.layout.next(this.getLayout(1, 1));

    this.store.select(selectDashboardState).pipe(
      map(dashboardState => dashboardState.homeLayout || 0),
      first()
    ).subscribe(id => {
      const selected = this.layouts.find(hpcl => hpcl && hpcl.id === id) || this.layouts[0];
      this.onChangeLayout(selected);
    });
  }

  ngOnInit() {
    const check$ = this.checkLayout.asObservable().pipe(filter(v => v));
    const scroll$ = this.scrollDispatcher.scrolled().pipe(map((e: any) => {
      const el = e.elementRef.nativeElement;
      return el.scrollTop;
    }), startWith(0));

    // Load cards as they come into view
    this.viewMonitorSub = combineLatest([scroll$, check$]).pipe(debounceTime(200)).subscribe(([scrollTop, check]) => {
      // User has scrolled - check the remaining cards that have not been loaded to see if any are now visible and shoule be loaded
      // Only load the first one - after that one has loaded, we'll call this method again and check for the next one
      const remaining = [];
      const processedCard = false;
      for (const index of this.notLoadedCardIndices) {
        const cardElement = this.endpointElements.toArray()[index] as ElementRef;
        const cardTop = cardElement.nativeElement.offsetTop;
        const cardBottom = cardTop + cardElement.nativeElement.offsetHeight;
        const height = this.endpointsPanel.nativeElement.offsetParent.offsetHeight;
        const scrollBottom = scrollTop + height;
        // Check if the card is in view - either its top or bottom must be withtin he visible scroll area
        if ((cardTop >= scrollTop && cardTop <= scrollBottom) || (cardBottom >= scrollTop && cardBottom <= scrollBottom)) {
          const card = this.endpointCards.toArray()[index];
          this.cardsToLoad.push(card);
        } else {
          remaining.push(index);
        }
      }
      this.processCardsToLoad();
      this.notLoadedCardIndices = remaining;
    });
  }

  processCardsToLoad() {
    if (!this.isLoadingACard && this.cardsToLoad.length > 0) {
      const nextCardToLoad = this.cardsToLoad.shift();
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

  setCardsToLoad(cards: any[]) {
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
    this.processCardsToLoad();
    this.checkCardsInView();
  }

  @HostListener('window:resize')
  onResize() {
    // If we resize the window and make it larger then new cards may come into view
    this.checkCardsInView();
  }

  // Check the cards in view
  checkCardsInView() {
    this.checkLayout.next(true);
  }

  public toggleShowAllEndpoints() {
    this.showMode.next(!this.showAllEndpoints);
  }

  // The layout was changed
  public onChangeLayout(layout: HomePageCardLayout) {
    this.layoutID = layout.id;

    // If the layout is automatic, then adjust based on number of things to show
    const lay$ = layout.id === 0 ? this.automaticLayout() : of(layout);
    lay$.pipe(first()).subscribe(lo => {
      this.layout.next(lo);

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
    const processed = {};
    const result = [];
    const epMap = {};
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
        switch (eps.length) {
          case 1:
            return this.getLayout(1, 1);
          case 2:
            return this.getLayout(1, 2);
          case 3:
            return this.getLayout(2, 2);
          case 4:
            return this.getLayout(2, 2);
          default:
            return this.getLayout(3, 2);
        }
      })
    );
  }

  private getLayout(x: number, y: number): HomePageCardLayout {
    return this.layouts.find(item => item && item.x === x && item.y === y);
  }
}
