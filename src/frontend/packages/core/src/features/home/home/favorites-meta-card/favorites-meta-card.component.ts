
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, Injector, Input, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { take, defaultIfEmpty } from 'rxjs/operators';
import { entityCatalog, FavoriteIconData, IFavoriteMetadata, UserFavorite, UserFavoriteManager, UserFavoritesDataService } from '@stratosui/store';

import { EntityFavoriteStarComponent } from '../../../../core/entity-favorite-star/entity-favorite-star.component';
import { FreshEntityNameService } from '../../../../core/signals/fresh-entity-name.service';
import { ConfirmationDialogConfig } from '../../../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../shared/components/confirmation-dialog.service';

@Component({
  selector: 'app-favorites-meta-card',
  templateUrl: './favorites-meta-card.component.html',
  styleUrls: ['./favorites-meta-card.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    EntityFavoriteStarComponent
],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FavoritesMetaCardComponent {
  private router = inject(Router);
  private confirmDialog = inject(ConfirmationDialogService);
  private userFavoriteManager = inject(UserFavoriteManager);
  private favoritesData = inject(UserFavoritesDataService);
  private freshNames = inject(FreshEntityNameService);
  private injector = inject(Injector);


  @Input()
  public endpoint: any;

  public favorite: UserFavorite<IFavoriteMetadata>;

  // Type of favorite - e.g. 'Application'
  public favoriteType: string;

  public routerLink!: string;

  public icon: FavoriteIconData;

  public valid = true;

  // Reactive favorite, so the rendered name tracks freshly-fetched entity data.
  private readonly favoriteSig = signal<UserFavorite<IFavoriteMetadata> | null>(null);

  // The name to render: the freshly-fetched entity name when available, else
  // the stored favorite metadata name (signal-native replacement for the old
  // static `this.name = favorite.metadata.name`).
  readonly displayName = computed(() => {
    const fav = this.favoriteSig();
    if (!fav) {
      return '';
    }
    return this.freshNames.freshNameFor(fav) ?? fav.metadata.name;
  });

  // Last name persisted, so a refresh round-trip doesn't fire duplicate POSTs.
  private lastPersisted: string | null = null;

  constructor() {
    // Persist a corrected name back to the favorites store when the fresh
    // entity name diverges from the stored one (signal-native replacement for
    // the deleted ngrx `syncFavorite`). The guard self-settles: updateMetadata
    // updates the favorites signal, the parent re-passes the favorite, and the
    // next run sees fresh === stored.
    effect(() => {
      const fav = this.favoriteSig();
      if (!fav) {
        return;
      }
      const fresh = this.freshNames.freshNameFor(fav);
      if (fresh && fresh !== fav.metadata.name && fresh !== this.lastPersisted) {
        const updated = this.userFavoriteManager.getUserFavoriteFromObject(fav);
        if (!updated) {
          return;
        }
        this.lastPersisted = fresh;
        updated.metadata = { ...updated.metadata, name: fresh };
        this.favoritesData.updateMetadata(updated);
      }
    });
  }

  @Input()
  set favoriteEntity(favoriteEntity: UserFavorite<IFavoriteMetadata>) {
    if (favoriteEntity) {
      this.favorite = favoriteEntity;
      this.favoriteType = this.favorite.getPrettyTypeName();
      this.icon = this.favorite.getIcon();
      this.routerLink = this.favorite.getLink();
      this.lastPersisted = null;
      this.favoriteSig.set(favoriteEntity);
    }
  }

  openFavorite() {
    if (!this.routerLink) {
      return;
    }
    const entityDef = entityCatalog.getEntity(this.favorite.endpointType, this.favorite.entityType);
    // getIsValid hooks now use inject(HttpClient) for a direct existence
    // probe (signal-native; no ngrx pipeline), so the call must run inside
    // an injection context.
    const isValidObs = (entityDef.builders.entityBuilder && entityDef.builders.entityBuilder.getIsValid) ?
    runInInjectionContext(this.injector, () => entityDef.builders.entityBuilder.getIsValid(this.favorite)) : of(true);
    isValidObs.pipe(take(1), defaultIfEmpty(false)).subscribe(isValid => {
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
