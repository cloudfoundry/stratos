import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { SetHomeCardLayoutAction } from '../../../../../store/src/actions/dashboard-actions';
import { RouterNav } from '../../../../../store/src/actions/router.actions';
import { AppState, IRequestEntityTypeState } from '../../../../../store/src/app-state';
import { EndpointModel, entityCatalog } from '../../../../../store/src/public-api';
import { selectDashboardState } from '../../../../../store/src/selectors/dashboard.selectors';
import { UserFavoriteManager } from '../../../../../store/src/user-favorite-manager';
import { EndpointsService } from '../../../core/endpoints.service';
import { HomePageCardLayout } from '../home.types';
import { IUserFavoritesGroups } from './../../../../../store/src/types/favorite-groups.types';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent {
  public allEndpointIds$: Observable<string[]>;
  public haveRegistered$: Observable<boolean>;

  public endpoints$: Observable<any>;

  public layouts$: Observable<HomePageCardLayout[]>;

  private layout = new BehaviorSubject<HomePageCardLayout>(null);
  public layout$: Observable<HomePageCardLayout>;

  public columns = 1;

  public layoutID = 0;

  private layouts: HomePageCardLayout[];

  constructor(
    public endpointsService: EndpointsService,
    private store: Store<AppState>,
    public userFavoriteManager: UserFavoriteManager
  ) {
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

    // Get all endpoints - need to think about the order - those with favorites should appear first
    // Would be good to have a way to order the endpoints in the UI
    // Need to persist this somewhere - user config? How to remove un-registered endpoints?

    this.layouts = [
      new HomePageCardLayout(0, 0, 'Automatic'),
      new HomePageCardLayout(1, 1, 'Single Column'),
      new HomePageCardLayout(1, 2, 'Compact Single Column'),
      new HomePageCardLayout(2, 1, 'Two Column'),
      new HomePageCardLayout(2, 2, 'Compact Two Column'),
      new HomePageCardLayout(3, 2, 'Three Column'),
    ];
    this.layouts$ = of(this.layouts);

    this.store.select(selectDashboardState).pipe(
      map(dashboardState => dashboardState.homeLayout || 0),
      first()
    ).subscribe(id => {
      const selected = this.layouts.find(hpcl => hpcl.id === id) || this.layouts[0];
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
            return new HomePageCardLayout(1, 1);
          case 2:
            return new HomePageCardLayout(1, 2);
          case 3:
            return new HomePageCardLayout(2, 2);
          case 4:
            return new HomePageCardLayout(2, 2);
          default:
            return new HomePageCardLayout(3, 2);
        }
      })
    );
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

