import { Component, Input } from '@angular/core';

import { IFavoritesMetaCardConfig } from '../../../../../../store/src/favorite-config-mapper';
import { entityCatalog } from '../../../../../../store/src/public-api';
import { IFavoriteEntity } from '../../../../../../store/src/types/user-favorite-manager.types';
import { IFavoriteMetadata, UserFavorite } from '../../../../../../store/src/types/user-favorites.types';

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
}
