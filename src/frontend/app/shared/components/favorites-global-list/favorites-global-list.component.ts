import { map, filter } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { IAllFavorites, UserFavoriteManager, IGroupedFavorites, IFavoriteEntity } from '../../../core/user-favorite-manager';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';

@Component({
  selector: 'app-favorites-global-list',
  templateUrl: './favorites-global-list.component.html',
  styleUrls: ['./favorites-global-list.component.scss']
})
export class FavoritesGlobalListComponent implements OnInit {
  public favs$: Observable<IAllFavorites<any>>;
  constructor(private store: Store<AppState>) { }

  ngOnInit() {
    const manager = new UserFavoriteManager(this.store);
    this.favs$ = manager.hydrateAllFavorites().pipe(
      filter(favs => !!favs),
      map(favs => ({
        ...favs,
        entityGroups: this.sortFavoriteGroups(favs.entityGroups)
      }))
    );
  }
  private sortFavoriteGroups(entityGroups: IGroupedFavorites<any>[]) {
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

  private sortFavoriteGroup(entityA: IFavoriteEntity<any>, entityB: IFavoriteEntity<any>) {
    if (entityA.favorite.entityType < entityB.favorite.entityType) {
      return -1;
    }
    if (entityA.favorite.entityType > entityB.favorite.entityType) {
      return 1;
    }
    return 0;
  }
}
