import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AppState } from '../../../../../store/src/app-state';
import { getFavoriteInfoObservable } from '../../../../../store/src/helpers/store-helpers';
import { IFavoriteEntity, IGroupedFavorites } from '../../../../../store/src/types/user-favorite-manager.types';
import { IFavoritesInfo } from '../../../../../store/src/types/user-favorites.types';
import { UserFavoriteManager } from '../../../../../store/src/user-favorite-manager';


@Component({
  selector: 'app-favorites-global-list',
  templateUrl: './favorites-global-list.component.html',
  styleUrls: ['./favorites-global-list.component.scss']
})
export class FavoritesGlobalListComponent implements OnInit {
  public favInfo$: Observable<IFavoritesInfo>;
  public favoriteGroups$: Observable<IGroupedFavorites[]>;
  constructor(
    private store: Store<AppState>,
    private userFavoriteManager: UserFavoriteManager
  ) { }

  @Input() showFilters: boolean;

  ngOnInit() {
    this.favoriteGroups$ = this.userFavoriteManager.hydrateAllFavorites().pipe(
      map(favs => this.sortFavoriteGroups(favs))
    );

    this.favInfo$ = getFavoriteInfoObservable(this.store);
  }

  private sortFavoriteGroups(entityGroups: IGroupedFavorites[]) {
    if (!entityGroups) {
      return entityGroups;
    }
    return entityGroups.map(group => {
      if (group.entities) {
        group.entities = group.entities.sort(this.sortFavoriteGroup);
      }
      return group;
    });
  }

  private sortFavoriteGroup(entityA: IFavoriteEntity, entityB: IFavoriteEntity) {
    if (entityA.favorite.entityType < entityB.favorite.entityType) {
      return -1;
    }
    if (entityA.favorite.entityType > entityB.favorite.entityType) {
      return 1;
    }
    return 0;
  }

  public trackByEndpointId(index: number, group: IGroupedFavorites) {
    return group.endpoint.favorite.guid;
  }
}
