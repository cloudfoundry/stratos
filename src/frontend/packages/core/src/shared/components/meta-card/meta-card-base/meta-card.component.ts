import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, computed, contentChild, contentChildren, signal, input, linkedSignal } from '@angular/core';
import { combineLatest, Observable, of as observableOf, of } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  MenuItem,
  IFavoriteMetadata,
  UserFavorite,
  StratosStatus,
} from '@stratosui/store';
import { ApplicationStateIconComponent } from '../../application-state/application-state-icon/application-state-icon.component';
import { CardStatusComponent } from '../../cards/card-status/card-status.component';
import { ClickStopPropagationDirective } from '../../../../core/click-stop-propagation.directive';
import { EntityFavoriteStarComponent } from '../../../../core/entity-favorite-star/entity-favorite-star.component';
import { CustomIconComponent } from '../../custom-material/custom-material.component';
import { AppProgressBarComponent } from '../../progress-bar/app-progress-bar.component';
import { MetaCardItemComponent } from '../meta-card-item/meta-card-item.component';
import { MetaCardTitleComponent } from '../meta-card-title/meta-card-title.component';


@Component({
  selector: 'app-meta-card',
  templateUrl: './meta-card.component.html',
  styleUrls: ['./meta-card.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    CustomIconComponent,
    ApplicationStateIconComponent,
    CardStatusComponent,
    ClickStopPropagationDirective,
    EntityFavoriteStarComponent,
    AppProgressBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetaCardComponent {
  readonly menuOpen = signal(false);

  // Signal query so items a card adds after the first render (behind an
  // @if waiting on async data) re-render this OnPush view.
  readonly metaItems = contentChildren(MetaCardItemComponent);

  // Optional: a card without a title renders no header.
  readonly title = contentChild(MetaCardTitleComponent);

  readonly status$ = input<Observable<StratosStatus>>();

  readonly favorite = input<UserFavorite<IFavoriteMetadata> | null>();

  // Vestigial no-op input. The legacy ngrx favorite-star fallback (entity
  // monitor -> UserFavoriteManager.getFavorite) was removed with the rest of
  // the ngrx list framework — live cards supply [favorite] explicitly. The
  // only remaining [entityConfig] binder, card-app, is dead `list/` code
  // deleted in workstream D; this input keeps it compiling until then.
  readonly entityConfig = input<unknown>();

  public readonly confirmFavoriteRemoval = input(false);

  readonly statusIcon = input(true);

  readonly statusIconByTitle = input(false);

  readonly statusIconTooltip = input<string>();

  readonly statusBackground = input(false);

  readonly mode = input<string>();

  readonly clickAction = input<() => void>();

  readonly actionMenu = input<MenuItem[] | null>();

  // The menu to show: the last one bound, since binding null or undefined
  // keeps the previous menu. The defaults are filled in on the caller's own
  // items, so the items shown are the ones the caller passed.
  readonly menuItems = linkedSignal<MenuItem[] | null | undefined, MenuItem[] | undefined>({
    source: this.actionMenu,
    computation: (actionMenu, previous) => actionMenu
      ? actionMenu.map(menuItem => {
        if (!menuItem.can) {
          menuItem.separator = menuItem.label === '-';
          menuItem.can = of(true);
        }
        if (!menuItem.disabled) {
          menuItem.disabled = observableOf(false);
        }
        return menuItem;
      })
      : previous?.value,
  });

  // True when the user may run at least one of the actions.
  readonly showMenu$ = computed(() => {
    const menuItems = this.menuItems();
    if (!menuItems) {
      return undefined;
    }
    const nonSeparators = menuItems
      .filter(menuItem => !menuItem.separator)
      .map(menuItem => menuItem.can ?? of(true));
    return combineLatest(nonSeparators).pipe(
      map(cans => cans.some(can => can))
    );
  });

  public isDeleting$: Observable<boolean> = observableOf(false);

  toggleMenu(): void {
    this.menuOpen.update(open => !open);
  }

  menuItemClick(menuItem: MenuItem): void {
    menuItem.action();
    this.menuOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Close menu when clicking outside
    if (this.menuOpen()) {
      const target = event.target as HTMLElement;
      if (!target.closest('.meta-card__header-container__actions')) {
        this.menuOpen.set(false);
      }
    }
  }
}
