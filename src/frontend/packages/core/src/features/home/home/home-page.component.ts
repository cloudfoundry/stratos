import { ScrollDispatcher } from '@angular/cdk/scrolling';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, Observable, of, Subscription } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { SetHomeCardLayoutAction } from '../../../../../store/src/actions/dashboard-actions';
import { RouterNav } from '../../../../../store/src/actions/router.actions';
import { AppState, IRequestEntityTypeState } from '../../../../../store/src/app-state';
import { EndpointModel, entityCatalog } from '../../../../../store/src/public-api';
import { selectDashboardState } from '../../../../../store/src/selectors/dashboard.selectors';
import { UserFavoriteManager } from '../../../../../store/src/user-favorite-manager';
import { EndpointsService } from '../../../core/endpoints.service';
import { IUserFavoritesGroups } from './../../../../../store/src/types/favorite-groups.types';
import { HomePageCardLayout } from './../home.types';
import { HomePageEndpointCardComponent } from './home-page-endpoint-card/home-page-endpoint-card.component';

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

  public columns = 1;

  public layoutID = 0;

  private layouts: HomePageCardLayout[] = [
    new HomePageCardLayout(0, 0, 'Automatic'),
    null,
    new HomePageCardLayout(1, 1, 'Single Column'),
    new HomePageCardLayout(1, 2, 'Compact Single Column'),
    new HomePageCardLayout(2, 1, 'Two Column'),
    new HomePageCardLayout(2, 2, 'Compact Two Column'),
    new HomePageCardLayout(3, 2, 'Three Column'),
  ];

  @ViewChild('endpointsPanel') endpointsPanel;

  @ViewChildren(HomePageEndpointCardComponent) endpointCards: QueryList<HomePageEndpointCardComponent>;
  @ViewChildren('endpointCard') endpointElements: QueryList<ElementRef>;

  notLoadedCardIndices: number[] = [];

  private sub: Subscription;

  constructor(
    public endpointsService: EndpointsService,
    private store: Store<AppState>,
    public userFavoriteManager: UserFavoriteManager,
    private scrollDispatcher: ScrollDispatcher,
  ) {
    this.layouts$ = of(this.layouts);
    this.layout$ = this.layout.asObservable();
    this.allEndpointIds$ = this.endpointsService.endpoints$.pipe(
      map(endpoints => Object.values(endpoints).map(endpoint => endpoint.guid))
    );
    this.haveRegistered$ = this.endpointsService.haveRegistered$;

    // Only show endpoints that have Home Card metadata
    this.endpoints$ = combineLatest([this.endpointsService.endpoints$, userFavoriteManager.getAllFavorites()]).pipe(
     map(([endpoints, [favGroups, favs]]) => {
       const ordered = this.orderEndpoints(endpoints, favGroups);
       return ordered.filter(ep => {
        const defn = entityCatalog.getEndpoint(ep.cnsi_type, ep.sub_type);
        return !!defn.definition.homeCard;
      })
    })
    );

    // Set an initial layout
    this.layout.next(new HomePageCardLayout(1, 1));

    this.store.select(selectDashboardState).pipe(
      map(dashboardState => dashboardState.homeLayout || 0),
      first()
    ).subscribe(id => {
      const selected = this.layouts.find(hpcl => hpcl && hpcl.id === id) || this.layouts[0];
      this.onChangeLayout(selected);
    })

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

  }

  ngOnInit() {
    // Listen for scroll events - used to load cards as they come into view
    this.sub = this.scrollDispatcher.scrolled().subscribe((x:any) => {
      const el = x.elementRef.nativeElement;
      this.handleScroll(el.scrollTop);
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  ngAfterViewInit(): void {
    this.endpointElements.changes.subscribe(cards => {
      this.notLoadedCardIndices = [];
      for(let i=0;i< cards.length; i++) {
        this.notLoadedCardIndices.push(i);
      }
      // Schedule a check for cards that are visible and should be loaded
      setTimeout(() => this.handleScroll(), 100);
    });
  }

  // This is called after a card has loaded - we call the scroll handler again
  // to check if there are more cards that are visible and thus can be loaded
  cardLoaded() {
    console.log('Card loaded');
    this.handleScroll();
  }

  // User has scrolled - check the remaining cards that have not been loaded
  // to see if any are now visible and shoule be loaded
  // Only load the first one - after that one has loaded, we'll call this method again
  // and check for the next one
  handleScroll(scrollTop: number = 0) {
    const remaining = [];
    let processedCard = false;
    for (const index of this.notLoadedCardIndices) {
      const cardElement = this.endpointElements.toArray()[index] as ElementRef;
      const top = cardElement.nativeElement.offsetTop;
      const height = this.endpointsPanel.nativeElement.offsetParent.offsetHeight;
      const bottom = scrollTop + height;
      if (!processedCard && top >= scrollTop && top <= bottom) {
        const card = this.endpointCards.toArray()[index];
        card.load();
        processedCard = true;
      } else {
        remaining.push(index);
      }
    };
    this.notLoadedCardIndices = remaining;
  }

  public onChangeLayout(layout: HomePageCardLayout) {
    console.log('onChangeLayout');
    console.log(layout);
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
      console.log('Handle scroll');
      this.handleScroll();
    });
  }

  // Order the endpoint cards - we always show all endpoints, order is:
  // 1. Endpoint has been added as a favourite
  // 2. Endpoint that has child favourites
  // 3. Remaining endpoints
  private orderEndpoints(endpoints: IRequestEntityTypeState<EndpointModel>, favorites: IUserFavoritesGroups): EndpointModel[] {
    const processed = {};
    const result = [];

    Object.keys(favorites).forEach(fav => {
      if (!favorites[fav].ethereal) {
        const id = this.userFavoriteManager.getEndpointIDFromFavoriteID(fav);
        if (!!endpoints[id] && !processed[id]) {
          processed[id] = true;
          result.push(endpoints[id]);
        }
      }
    });

    Object.keys(favorites).forEach(fav => {
      if (favorites[fav].ethereal) {
        const id = this.userFavoriteManager.getEndpointIDFromFavoriteID(fav);
        if (!!endpoints[id] && !processed[id]) {
          processed[id] = true;
          result.push(endpoints[id]);
        }
      }
    });

    Object.values(endpoints).forEach(ep => {
      if (!processed[ep.guid]) {
        processed[ep.guid] = true;
        result.push(ep);
      }
    })

    return result;
  }

  // Automatic layout - select the best layout based on the available endpoints
  private automaticLayout(): Observable<HomePageCardLayout> {
    return this.endpointsService.endpoints$.pipe(
      map(eps => Object.values(eps)),
      map(eps => eps.filter(ep => {
        const defn = entityCatalog.getEndpoint(ep.cnsi_type, ep.sub_type);
        return !!defn.definition.homeCard;
      })),
      map(eps => {
        switch(eps.length) {
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

  // Validate all of the entities one by one and update if they are no longer valid
  // validate() {
  //   this.favoriteGroups$.pipe(first()).subscribe(f => {
  //     console.log('Validating favourites');
  //     console.log(f);
  //     f.forEach(group => {
  //       console.log(group);
  //       // Maybe we need to check the enpoint via the health check first?
  //       // Check each entity in turn
  //       group.entities.forEach(entity => {
  //         console.log(entity);
  //       });
  //     })
  //   });
  // }
}

