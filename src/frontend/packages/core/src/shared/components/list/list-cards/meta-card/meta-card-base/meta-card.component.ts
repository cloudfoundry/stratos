import { CommonModule } from '@angular/common';
import { Component, ContentChild, ContentChildren, Input, OnDestroy, QueryList, HostListener } from '@angular/core';
import {
  EntityMonitorFactory,
  MenuItem,
  IFavoriteMetadata,
  UserFavorite,
  ComponentEntityMonitorConfig,
  StratosStatus,
} from '@stratosui/store';
import { combineLatest, Observable, of as observableOf, of, Subscription } from 'rxjs';
import { first, map, tap } from 'rxjs/operators';

import { UserFavoriteManager } from '@stratosui/store';
import { safeUnsubscribe } from '../../../../../../core/utils.service';
import { ApplicationStateIconComponent } from '../../../../application-state/application-state-icon/application-state-icon.component';
import { CardStatusComponent } from '../../../../cards/card-status/card-status.component';
import { ClickStopPropagationDirective } from '../../../../../../core/click-stop-propagation.directive';
import { EntityFavoriteStarComponent } from '../../../../../../core/entity-favorite-star/entity-favorite-star.component';
import { MetaCardItemComponent } from '../meta-card-item/meta-card-item.component';
import { MetaCardTitleComponent } from '../meta-card-title/meta-card-title.component';
import { CustomIconComponent } from '../../../../../../shared/components/custom-material/custom-material.component';


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
  ]
})
export class MetaCardComponent implements OnDestroy {

  public menuOpen = false;

  @ContentChildren(MetaCardItemComponent)
  metaItems: QueryList<MetaCardItemComponent>;

  @ContentChild(MetaCardTitleComponent, { static: true })
  title: MetaCardTitleComponent;

  @Input()
  status$: Observable<StratosStatus>;

  @Input()
  public favorite: UserFavorite<IFavoriteMetadata>;

  @Input()
  public confirmFavoriteRemoval = false;

  @Input()
  statusIcon = true;

  @Input()
  statusIconByTitle = false;

  @Input()
  statusIconTooltip: string;

  @Input()
  statusBackground = false;

  @Input()
  mode: string;

  @Input()
  clickAction: () => void = null;

  @Input()
  set entityConfig(entityConfig: ComponentEntityMonitorConfig) {
    if (entityConfig) {
      const entityMonitor = this.entityMonitorFactory.create(
        entityConfig.guid,
        entityConfig.schema
      );
      this.isDeleting$ = entityMonitor.isDeletingEntity$;
      if (!this.favorite) {
        this.entityMonitorSub = entityMonitor.entity$.pipe(
          first(),
          tap(entity => this.favorite = this.userFavoriteManager.getFavorite(
            entity,
            entityConfig.schema.entityType,
            entityConfig.schema.endpointType
          ))
        ).subscribe();
      }
    }
  }

  @Input('actionMenu')
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

  entityMonitorSub: Subscription;

  public showMenu$: Observable<boolean>;
  public isDeleting$: Observable<boolean> = observableOf(false);
  private pActionMenu: MenuItem[];

  constructor(
    private entityMonitorFactory: EntityMonitorFactory,
    private userFavoriteManager: UserFavoriteManager,
  ) { }

  ngOnDestroy() {
    safeUnsubscribe(this.entityMonitorSub);
  }

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
