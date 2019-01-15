import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { AppState } from '../../store/app-state';
import { UserFavorite } from '../../store/types/user-favorites.types';
import { UserFavoriteManager } from '../user-favorite-manager';

@Component({
  selector: 'app-entity-favorite-star',
  templateUrl: './entity-favorite-star.component.html',
  styleUrls: ['./entity-favorite-star.component.scss']
})
export class EntityFavoriteStarComponent implements OnInit {

  @Input()
  private favorite: UserFavorite;

  private userFavoriteManager: UserFavoriteManager;

  public isFavorite$: Observable<boolean>;

  constructor(store: Store<AppState>) {
    this.userFavoriteManager = new UserFavoriteManager(store);
  }

  public toggleFavorite(event) {
    event.cancelBubble = true;
    event.stopPropagation();
    this.userFavoriteManager.toggleFavorite(this.favorite);
  }

  ngOnInit() {
    this.isFavorite$ = this.userFavoriteManager.getIsFavoriteObservable(this.favorite);
  }

}
