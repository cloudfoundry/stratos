import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { IAllFavorites, UserFavoriteManager } from '../../../core/user-favorite-manager';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';

@Component({
  selector: 'app-favorites-global-list',
  templateUrl: './favorites-global-list.component.html',
  styleUrls: ['./favorites-global-list.component.scss']
})
export class FavoritesGlobalListComponent implements OnInit {
  public favs$: Observable<IAllFavorites>;
  constructor(private store: Store<AppState>) { }

  ngOnInit() {
    const manager = new UserFavoriteManager(this.store);
    this.favs$ = manager.hydrateAllFavorites();
  }
}
