import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AppState } from '@stratosui/store';
import { getFavoriteInfoObservable } from '@stratosui/store';
import { IFavoriteEntity, IGroupedFavorites } from '@stratosui/store';
import { IFavoritesInfo } from '@stratosui/store';
import { UserFavoriteManager } from '@stratosui/store';


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
