import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { RouterNav } from '../../../../../store/src/actions/router.actions';
import { AppState, IRequestEntityTypeState } from '../../../../../store/src/app-state';
import { EntityCatalogHelpers } from '../../../../../store/src/entity-catalog/entity-catalog.helper';
import { IUserFavoritesGroups } from '../../../../../store/src/types/favorite-groups.types';
import { UserFavorite } from '../../../../../store/src/types/user-favorites.types';
import { UserFavoriteManager } from '../../../../../store/src/user-favorite-manager';
import { EndpointsService } from '../../../core/endpoints.service';
import { LoggerService } from '../../../core/logger.service';

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

  constructor(
    endpointsService: EndpointsService,
    store: Store<AppState>,
    logger: LoggerService,
    public userFavoriteManager: UserFavoriteManager
  ) {
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

    this.showFilterToggle$ = userFavoriteManager.getAllFavorites().pipe(
      map(([, favEntities]: [IUserFavoritesGroups, IRequestEntityTypeState<UserFavorite>]) => {
        if (favEntities) {
          for (const favEntity of Object.values(favEntities)) {
            if (favEntity.entityType !== EntityCatalogHelpers.endpointType) {
              return true;
            }
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

