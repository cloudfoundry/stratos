import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { GetUserFavoritesAction } from '../../../store/actions/user-favourites-actions/get-user-favorites-action';
import { UserFavoriteHydrator } from '../../../core/user-favorite-hydrator';
import { PaginationMonitor } from '../../../shared/monitors/pagination-monitor';
import { IUserFavorite } from '../../../store/types/user-favorites.types';
import { userFavoritesPaginationKey } from '../../../store/effects/user-favoutites-effect';
import { entityFactory, userFavoritesSchemaKey } from '../../../store/helpers/entity-factory';
import { mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent {

  constructor(store: Store<AppState>) {
    const hydrator = new UserFavoriteHydrator(store);
    new PaginationMonitor<IUserFavorite>(
      store,
      userFavoritesPaginationKey,
      entityFactory(userFavoritesSchemaKey)
    ).currentPage$.pipe(
      mergeMap(list => {
        return list.map(fav => hydrator.hydrate(fav));
      })
    );
  }
}
