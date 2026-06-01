import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ContentChild, ContentChildren, Input, QueryList, HostListener } from '@angular/core';
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


export function createMetaCardMenuItemSeparator(): MenuItem {
  return {
    label: '-',
    separator: true,
    action: () => { }
  };
}

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
  public menuOpen = false;

  @ContentChildren(MetaCardItemComponent)
  metaItems!: QueryList<MetaCardItemComponent>;

  @ContentChild(MetaCardTitleComponent, { static: true })
  title!: MetaCardTitleComponent;

  @Input()
  status$!: Observable<StratosStatus>;

  @Input()
  favorite: UserFavorite<IFavoriteMetadata>;

  // Vestigial no-op input. The legacy ngrx favorite-star fallback (entity
  // monitor -> UserFavoriteManager.getFavorite) was removed with the rest of
  // the ngrx list framework — live cards supply [favorite] explicitly. The
  // only remaining [entityConfig] binder, card-app, is dead `list/` code
  // deleted in workstream D; this input keeps it compiling until then.
  @Input()
  entityConfig: unknown;

  @Input()
  public confirmFavoriteRemoval = false;

  @Input()
  statusIcon = true;

  @Input()
  statusIconByTitle = false;

  @Input()
  statusIconTooltip!: string;

  @Input()
  statusBackground = false;

  @Input()
  mode!: string;

  @Input()
  clickAction: () => void = null;

  @Input()
  set actionMenu(actionMenu: MenuItem[]) {
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
        .map(menuItem => menuItem.can);
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
    this.menuOpen = !this.menuOpen;
  }

  menuItemClick(menuItem: MenuItem): void {
    menuItem.action();
    this.menuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Close menu when clicking outside
    if (this.menuOpen) {
      const target = event.target as HTMLElement;
      if (!target.closest('.meta-card__header-container__actions')) {
        this.menuOpen = false;
      }
    }
  }
}
