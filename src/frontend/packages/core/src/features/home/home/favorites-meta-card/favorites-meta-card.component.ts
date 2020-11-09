import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { first } from 'rxjs/operators';

import { IFavoritesMetaCardConfig } from '../../../../../../store/src/favorite-config-mapper';
import { entityCatalog } from '../../../../../../store/src/public-api';
import { IFavoriteEntity } from '../../../../../../store/src/types/user-favorite-manager.types';
import { IFavoriteMetadata, UserFavorite } from '../../../../../../store/src/types/user-favorites.types';
import { UserFavoriteManager } from '../../../../../../store/src/user-favorite-manager';
import { ConfirmationDialogConfig } from '../../../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../shared/components/confirmation-dialog.service';

interface FavoriteIconData {
  icon?: string;
  iconFont?: string;
}

@Component({
  selector: 'app-favorites-meta-card',
  templateUrl: './favorites-meta-card.component.html',
  styleUrls: ['./favorites-meta-card.component.scss']
})
export class FavoritesMetaCardComponent {

  @Input()
  public endpoint;

  public favorite: UserFavorite<IFavoriteMetadata>;

  public prettyName: string;

  public config: IFavoritesMetaCardConfig;

  public icon: FavoriteIconData;

  public valid = true;

  constructor(
    private router: Router,
    private confirmDialog: ConfirmationDialogService,
    private userFavoriteManager: UserFavoriteManager,
  ) {}

  @Input()
  set favoriteEntity(favoriteEntity: IFavoriteEntity) {
    if (favoriteEntity) {
      const { cardMapper, favorite, prettyName } = favoriteEntity;
      this.favorite = favorite;
      this.prettyName = prettyName || 'Unknown';
      const entityDef = entityCatalog.getEntity(this.favorite.endpointType, this.favorite.entityType);
      this.icon = {
        icon: entityDef.definition.icon,
        iconFont: entityDef.definition.iconFont,
      };

      const config = cardMapper && favorite && favorite.metadata ? cardMapper(favorite.metadata) : null;
      this.config = config;
    }
  }

  openFavorite() {
    if (!this.config.routerLink) {
      return;
    }
    const entityDef = entityCatalog.getEntity(this.favorite.endpointType, this.favorite.entityType);
    const isValidObs = (entityDef.builders.entityBuilder && entityDef.builders.entityBuilder.getIsValid) ?
    entityDef.builders.entityBuilder.getIsValid(this.favorite.metadata) : of(true);
    isValidObs.pipe(first()).subscribe(isValid => {
      this.valid = isValid;
      if (!isValid) {
        const confirmation = new ConfirmationDialogConfig(
          'Remove this Favorite?',
          `The ${this.favorite.entityType} for this favorite appears to have been deleted. Remove the favorite?`,
          'Remove',
          true
        );
        this.confirmDialog.open(confirmation, () => { this.userFavoriteManager.toggleFavorite(this.favorite); })
      } else {
        // Navigate to the favorite
        this.router.navigate([this.config.routerLink]);
      }
    });
  }
}
