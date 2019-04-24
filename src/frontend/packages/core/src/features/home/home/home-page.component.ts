import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { RouterNav } from '../../../../../store/src/actions/router.actions';
import { AppState, IRequestEntityTypeState } from '../../../../../store/src/app-state';
import { IUserFavoritesGroups } from '../../../../../store/src/types/favorite-groups.types';
import { IFavoriteMetadata, UserFavorite } from '../../../../../store/src/types/user-favorites.types';
import { EndpointsService } from '../../../core/endpoints.service';
import { LoggerService } from '../../../core/logger.service';
import { UserFavoriteManager } from '../../../core/user-favorite-manager';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent {
  public allEndpointIds$: Observable<string[]>;
  public haveRegistered$: Observable<boolean>;

  public showFilterToggle$: Observable<boolean>;
  public showFilters = false;

  constructor(endpointsService: EndpointsService, store: Store<AppState>, logger: LoggerService) {
    this.allEndpointIds$ = endpointsService.endpoints$.pipe(
      map(endpoints => Object.values(endpoints).map(endpoint => endpoint.guid))
    );
    this.haveRegistered$ = endpointsService.haveRegistered$;

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

    const manager = new UserFavoriteManager(store, logger);
    this.showFilterToggle$ = manager.getAllFavorites().pipe(
      map(([, favEntities]: [IUserFavoritesGroups, IRequestEntityTypeState<UserFavorite<IFavoriteMetadata, any>>]) => {
        for (const favEntity of Object.values(favEntities)) {
          if (favEntity.entityType !== 'endpoint') {
            return true;
          }
        }
        return false;
      })
    );
  }

  public toggleShowFilters() {
    this.showFilters = !this.showFilters;
  }
}

