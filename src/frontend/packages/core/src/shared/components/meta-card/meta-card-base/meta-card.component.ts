import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ContentChild, Input, HostListener, contentChildren, signal, input } from '@angular/core';
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

  @ContentChild(MetaCardTitleComponent, { static: true })
  title!: MetaCardTitleComponent;

  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input()
  status$?: Observable<StratosStatus>;

  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input()
  favorite?: UserFavorite<IFavoriteMetadata> | null;

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

  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input()
  clickAction?: () => void;

  // TODO: Skipped for migration because:
  //  Accessor inputs cannot be migrated as they are too complex.
  @Input()
  set actionMenu(actionMenu: MenuItem[] | null) {
    if (actionMenu) {
      this.pActionMenu = actionMenu.map(menuItem => {
        if (!menuItem.can) {
          menuItem.separator = menuItem.label === '-';
          menuItem.can = of(true);
        }
        if (!menuItem.disabled) {
          menuItem.disabled = observableOf(false);
        }
        return menuItem;
      });

      const nonSeparators = actionMenu
        .filter(menuItem => !menuItem.separator)
        .map(menuItem => menuItem.can ?? of(true));
      this.showMenu$ = combineLatest(nonSeparators).pipe(
        map(cans => cans.some(can => can))
      );
    }
  }
  get actionMenu(): MenuItem[] {
    return this.pActionMenu;
  }

  public showMenu$!: Observable<boolean>;
  public isDeleting$: Observable<boolean> = observableOf(false);
  private pActionMenu!: MenuItem[];

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
