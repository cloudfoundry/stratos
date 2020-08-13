import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { first, tap } from 'rxjs/operators';

import { FavoritesConfigMapper } from '../../../../store/src/favorite-config-mapper';
import { IFavoriteMetadata, UserFavorite } from '../../../../store/src/types/user-favorites.types';
import { UserFavoriteManager } from '../../../../store/src/user-favorite-manager';
import { ConfirmationDialogConfig } from '../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../shared/components/confirmation-dialog.service';
import { EndpointsService } from '../endpoints.service';

@Component({
  selector: 'app-entity-favorite-star',
  templateUrl: './entity-favorite-star.component.html',
  styleUrls: ['./entity-favorite-star.component.scss']
})
export class EntityFavoriteStarComponent {

  @Input()
  set favorite(favorite: UserFavorite<IFavoriteMetadata>) {
    const name = this.favoritesConfigMapper.getPrettyTypeName(favorite);
    this.confirmationDialogConfig.message =
      `Are you sure you would you like to unfavorite this ${name ? name.toLocaleLowerCase() : 'favorite'}?`;
    this.isFavorite$ = this.userFavoriteManager.getIsFavoriteObservable(favorite);
    this.pFavourite = favorite;
  }

  @Input()
  public confirmRemoval = false;

  public isFavorite$: Observable<boolean>;

  private confirmationDialogConfig = new ConfirmationDialogConfig('Unfavorite?', '', 'Yes', true);

  private pFavourite: UserFavorite<IFavoriteMetadata>;

  constructor(
    private confirmDialog: ConfirmationDialogService,
    public endpointsService: EndpointsService,
    private userFavoriteManager: UserFavoriteManager,
    private favoritesConfigMapper: FavoritesConfigMapper
  ) {
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
