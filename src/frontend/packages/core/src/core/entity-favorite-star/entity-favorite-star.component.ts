import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { first, tap } from 'rxjs/operators';

import { AppState } from '../../../../store/src/app-state';
import { IFavoriteMetadata, UserFavorite } from '../../../../store/src/types/user-favorites.types';
import { ConfirmationDialogConfig } from '../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../shared/components/confirmation-dialog.service';
import { favoritesConfigMapper } from '../../shared/components/favorites-meta-card/favorite-config-mapper';
import { UserFavoriteManager } from '../user-favorite-manager';
import { LoggerService } from '../logger.service';

@Component({
  selector: 'app-entity-favorite-star',
  templateUrl: './entity-favorite-star.component.html',
  styleUrls: ['./entity-favorite-star.component.scss']
})
export class EntityFavoriteStarComponent {

  @Input()
  set favorite(favorite: UserFavorite<IFavoriteMetadata>) {
    const name = favoritesConfigMapper.getPrettyTypeName(favorite);
    this.confirmationDialogConfig.message =
      `Are you sure you would you like to unfavorite this ${name ? name.toLocaleLowerCase() : 'favorite'}?`;
    this.isFavorite$ = this.userFavoriteManager.getIsFavoriteObservable(favorite);
    this.pFavourite = favorite;
  }
  private pFavourite: UserFavorite<IFavoriteMetadata>;

  @Input()
  private confirmRemoval = false;

  private userFavoriteManager: UserFavoriteManager;

  public isFavorite$: Observable<boolean>;

  private confirmationDialogConfig = new ConfirmationDialogConfig('Unfavorite?', '', 'Yes', true);

  constructor(
    store: Store<AppState>,
    private confirmDialog: ConfirmationDialogService,
    logger: LoggerService) {
    this.userFavoriteManager = new UserFavoriteManager(store, logger);
  }

  public toggleFavorite(event: Event) {
    event.cancelBubble = true;
    event.stopPropagation();
    if (this.confirmRemoval) {
      this.isFavorite$.pipe(
        first(),
        tap(is => {
          if (is) {
            this.confirmDialog.open(this.confirmationDialogConfig, this.pToggleFavorite);
          } else {
            this.pToggleFavorite();
          }
        })
      ).subscribe();
    } else {
      this.pToggleFavorite();
    }
  }

  private pToggleFavorite = (res?: any) => {
    this.userFavoriteManager.toggleFavorite(this.pFavourite);
  }
}
