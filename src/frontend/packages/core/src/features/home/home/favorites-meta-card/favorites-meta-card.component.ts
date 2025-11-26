
import { ChangeDetectionStrategy, Component, Input  } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { first } from 'rxjs/operators';
import { entityCatalog, type FavoriteIconData, type IFavoriteMetadata, type UserFavorite, UserFavoriteManager } from '@stratosui/store';

import { EntityFavoriteStarComponent } from '../../../../core/entity-favorite-star/entity-favorite-star.component';
import { ConfirmationDialogConfig } from '../../../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../shared/components/confirmation-dialog.service';

@Component({
  selector: 'app-favorites-meta-card',
  templateUrl: './favorites-meta-card.component.html',
  styleUrls: ['./favorites-meta-card.component.scss'],
  standalone: true,
  imports: [
    EntityFavoriteStarComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FavoritesMetaCardComponent {

  @Input()
  public endpoint: unknown;

  public favorite: UserFavorite<IFavoriteMetadata>;

  // Type of favorite - e.g. 'Application'
  public favoriteType: string;

  // Favorite name
  public name!: string;

  public routerLink!: string;

  public icon: FavoriteIconData;

  public valid = true;

  constructor(
    private router: Router,
    private confirmDialog: ConfirmationDialogService,
    private userFavoriteManager: UserFavoriteManager,
  ) {}

  @Input()
  set favoriteEntity(favoriteEntity: UserFavorite<IFavoriteMetadata>) {
    if (favoriteEntity) {
      this.favorite = favoriteEntity;
      this.favoriteType = this.favorite.getPrettyTypeName();
      this.icon = this.favorite.getIcon();
      this.name = this.favorite.metadata.name;
      this.routerLink = this.favorite.getLink();
    }
  }

  openFavorite() {
    if (!this.routerLink) {
      return;
    }
    const entityDef = entityCatalog.getEntity(this.favorite.endpointType, this.favorite.entityType);
    const isValidObs = (entityDef.builders.entityBuilder?.getIsValid) ?
    entityDef.builders.entityBuilder.getIsValid(this.favorite) : of(true);
    isValidObs.pipe(first()).subscribe(isValid => {
      this.valid = isValid;
      if (!isValid) {
        const confirmation = new ConfirmationDialogConfig(
          'Remove this Favorite?',
          `The ${this.favoriteType} for this favorite appears to have been deleted. Remove the favorite?`,
          'Remove',
          true
        );
        this.confirmDialog.open(confirmation, () => { this.userFavoriteManager.toggleFavorite(this.favorite); });
      } else {
        // Navigate to the favorite
        this.router.navigate([this.routerLink]);
      }
    });
  }
}
