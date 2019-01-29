import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { AppState } from '../../store/app-state';
import { UserFavorite, IFavoriteMetadata } from '../../store/types/user-favorites.types';
import { UserFavoriteManager } from '../user-favorite-manager';
import { ConfirmationDialogService } from '../../shared/components/confirmation-dialog.service';
import { tap, first } from 'rxjs/operators';
import { ConfirmationDialogConfig } from '../../shared/components/confirmation-dialog.config';
import { favoritesConfigMapper } from '../../shared/components/favorites-meta-card/favorite-config-mapper';

@Component({
  selector: 'app-entity-favorite-star',
  templateUrl: './entity-favorite-star.component.html',
  styleUrls: ['./entity-favorite-star.component.scss']
})
export class EntityFavoriteStarComponent {

  @Input()
  set favorite(favorite: UserFavorite<IFavoriteMetadata>) {
    const name = favoritesConfigMapper.getPrettyTypeName(favorite);
    this.confirmationDialogConfig.message = `Would like to unfavorite this ${name}?`;
    this.isFavorite$ = this.userFavoriteManager.getIsFavoriteObservable(favorite);
    this._favorite = favorite;
  }
  private _favorite: UserFavorite<IFavoriteMetadata>;

  @Input()
  private confirmRemoval = false;

  private userFavoriteManager: UserFavoriteManager;

  public isFavorite$: Observable<boolean>;

  private confirmationDialogConfig = new ConfirmationDialogConfig('Unfavorite?', '', 'Yes', true);

  constructor(store: Store<AppState>, private confirmDialog: ConfirmationDialogService) {
    this.userFavoriteManager = new UserFavoriteManager(store);
  }

  public toggleFavorite(event: Event) {
    event.cancelBubble = true;
    event.stopPropagation();
    if (this.confirmRemoval) {
      this.isFavorite$.pipe(
        first(),
        tap(is => {
          if (is) {
            this.confirmDialog.open(this.confirmationDialogConfig, this._toggleFavorite);
          } else {
            this._toggleFavorite();
          }
        })
      ).subscribe();
    } else {
      this._toggleFavorite();
    }
  }

  private _toggleFavorite = () => {
    this.userFavoriteManager.toggleFavorite(this._favorite);
  }
}
