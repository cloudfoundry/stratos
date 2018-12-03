import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { mergeMap, map } from 'rxjs/operators';
import { UserFavoriteManager } from '../../../core/user-favorite-helpers';
import { PaginationMonitor } from '../../../shared/monitors/pagination-monitor';
import { AppState } from '../../../store/app-state';
import { userFavoritesPaginationKey } from '../../../store/effects/user-favorites-effect';
import { entityFactory, userFavoritesSchemaKey } from '../../../store/helpers/entity-factory';
import { combineLatest } from 'rxjs';
import { createGetApplicationAction } from '../../applications/application.service';
import { UserFavorite } from '../../../store/types/user-favorites.types';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {
  favs$: any;
  ngOnInit() {
    const hydrator = new UserFavoriteManager(this.store);

    this.favs$ = new PaginationMonitor<UserFavorite>(
      this.store,
      userFavoritesPaginationKey,
      entityFactory(userFavoritesSchemaKey)
    ).currentPage$.pipe(
      mergeMap(list => {
        return combineLatest(
          list.map(fav => hydrator.hydrateFavorite(fav).pipe(
            map(e => e.entity),
            map(entity => entity ? `${entity.entity.name}-${fav.entityType}` : null)
          ))
        );
      })
    );
  }

  constructor(private store: Store<AppState>) { }
}
