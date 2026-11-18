
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, Injector, computed, effect, inject, runInInjectionContext, signal, input, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { take, defaultIfEmpty } from 'rxjs/operators';
import { entityCatalog, IFavoriteMetadata, UserFavorite, UserFavoriteManager, UserFavoritesDataService } from '@stratosui/store';

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


  public readonly endpoint = input<any>();

  // The card renders nothing until a favorite is set.
  readonly favoriteEntity = input<UserFavorite<IFavoriteMetadata>>();

  // Type of favorite - e.g. 'Application'
  readonly favoriteType = computed(() => this.favoriteEntity()?.getPrettyTypeName() ?? '');

  // getLink() returns null when the entity defines no link; the template
  // guards every use with !!routerLink(), and openFavorite early-returns.
  readonly routerLink = computed(() => this.favoriteEntity()?.getLink() ?? null);

  readonly icon = computed(() => this.favoriteEntity()?.getIcon());

  // Signal: written after the first render; an OnPush view under zoneless CD only repaints for signal writes.
  readonly valid = signal(true);

  // Name fetched on demand (see recoverNameIfMissing) when the entity is in no
  // loaded signal and the favorite carries no stored name.
  private readonly fetchedName = signal<string | null>(null);
  private nameFetchAttempted = false;

  // The favorite the per-favorite state below was last reset for.
  private stateFor?: UserFavorite<IFavoriteMetadata>;

  // Name precedence: live entity data → stored metadata → on-demand fetched
  // name → entity id as a last resort. The metadata deref is guarded because a
  // favourite whose entity hasn't resolved can carry null metadata, and an
  // unguarded `.name` throw breaks the whole card's change detection (it took
  // down the entire endpoint home card).
  readonly displayName = computed(() => {
    const fav = this.favoriteEntity();
    if (!fav) {
      return '';
    }
    return this.freshNames.freshNameFor(fav)
      ?? fav.metadata?.name
      ?? this.fetchedName()
      ?? fav.entityId
      ?? '';
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
      const fav = this.favoriteEntity();
      if (!fav) {
        return;
      }
      // A new favorite starts clean, and has its name looked up if it is
      // missing. In this effect, ahead of the check below, so the lookup's
      // own save is seen by that check.
      if (fav !== this.stateFor) {
        this.stateFor = fav;
        untracked(() => {
          this.lastPersisted = null;
          this.fetchedName.set(null);
          this.nameFetchAttempted = false;
          this.recoverNameIfMissing(fav);
        });
      }
      const fresh = this.freshNames.freshNameFor(fav);
      if (fresh && fresh !== fav.metadata?.name && fresh !== this.lastPersisted) {
        this.persistName(fav, fresh);
      }
    });
  }

  // Backup for the signal-only `freshNameFor`: when a favourite has no stored
  // name and its entity is in no loaded signal (home cards fetch only counts),
  // fetch the single resource once, render its name, and persist it so the
  // null-metadata favourite is healed for good.
  private recoverNameIfMissing(fav: UserFavorite<IFavoriteMetadata>) {
    if (this.nameFetchAttempted || fav.metadata?.name || this.freshNames.freshNameFor(fav)) {
      return;
    }
    this.nameFetchAttempted = true;
    this.freshNames.fetchNameFor(fav).pipe(take(1)).subscribe(name => {
      if (!name) {
        return;
      }
      this.fetchedName.set(name);
      this.persistName(fav, name);
    });
  }

  private persistName(fav: UserFavorite<IFavoriteMetadata>, name: string) {
    const updated = this.userFavoriteManager.getUserFavoriteFromObject(fav);
    if (!updated) {
      return;
    }
    this.lastPersisted = name;
    updated.metadata = { ...updated.metadata, name };
    this.favoritesData.updateMetadata(updated);
  }

  openFavorite() {
    const favorite = this.favoriteEntity();
    const routerLink = this.routerLink();
    if (!favorite || !routerLink) {
      return;
    }
    const entityDef = entityCatalog.getEntity(favorite.endpointType, favorite.entityType);
    // getIsValid hooks now use inject(HttpClient) for a direct existence
    // probe (signal-native; no ngrx pipeline), so the call must run inside
    // an injection context.
    const entityBuilder = entityDef.builders.entityBuilder;
    const getIsValid = entityBuilder?.getIsValid;
    const isValidObs = getIsValid ?
    runInInjectionContext(this.injector, () => getIsValid(favorite)) : of(true);
    isValidObs.pipe(take(1), defaultIfEmpty(false)).subscribe(isValid => {
      this.valid.set(isValid);
      if (!isValid) {
        const confirmation = new ConfirmationDialogConfig(
          'Remove this Favorite?',
          `The ${this.favoriteType()} for this favorite appears to have been deleted. Remove the favorite?`,
          'Remove',
          true
        );
        this.confirmDialog.open(confirmation, () => { this.userFavoriteManager.toggleFavorite(favorite); });
      } else {
        // Navigate to the favorite
        this.router.navigate([routerLink]);
      }
    });
  }
}
