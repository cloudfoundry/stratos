import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ContentChild, ContentChildren, Input, OnDestroy, OnInit, QueryList, HostListener, inject } from '@angular/core';
import { combineLatest, Observable, of as observableOf, of, Subscription } from 'rxjs';
import { take, map, tap } from 'rxjs/operators';

import {
  EntityMonitorFactory,
  MenuItem,
  IFavoriteMetadata,
  UserFavorite,
  ComponentEntityMonitorConfig,
  StratosStatus,
  UserFavoriteManager,
} from '@stratosui/store';
import { safeUnsubscribe } from '../../../../../../core/utils.service';
import { ApplicationStateIconComponent } from '../../../../application-state/application-state-icon/application-state-icon.component';
import { CardStatusComponent } from '../../../../cards/card-status/card-status.component';
import { ClickStopPropagationDirective } from '../../../../../../core/click-stop-propagation.directive';
import { EntityFavoriteStarComponent } from '../../../../../../core/entity-favorite-star/entity-favorite-star.component';
import { CustomIconComponent } from '../../../../custom-material/custom-material.component';
import { AppProgressBarComponent } from '../../../../progress-bar/app-progress-bar.component';
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
export class MetaCardComponent implements OnInit, OnDestroy {
  private entityMonitorFactory = inject(EntityMonitorFactory);
  private userFavoriteManager = inject(UserFavoriteManager);


  public menuOpen = false;

  @ContentChildren(MetaCardItemComponent)
  metaItems!: QueryList<MetaCardItemComponent>;

  @ContentChild(MetaCardTitleComponent, { static: true })
  title!: MetaCardTitleComponent;

  @Input()
  status$!: Observable<StratosStatus>;

  // Tracks whether the parent bound [favorite] at all. Distinct from the value
  // being null/undefined: the parent's value can transition (e.g. set in
  // ngOnInit), but if the binding exists the setter fires at least once.
  // We use this in ngOnInit to skip the entity-monitor fallback so it never
  // poisons a parent-supplied favorite via the cross-endpoint stamped cfGuid.
  private favoriteBound = false;
  private pFavorite: UserFavorite<IFavoriteMetadata>;
  @Input()
  set favorite(fav: UserFavorite<IFavoriteMetadata>) {
    this.favoriteBound = true;
    this.pFavorite = fav;
  }
  get favorite(): UserFavorite<IFavoriteMetadata> {
    return this.pFavorite;
  }

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

  private pEntityConfig: ComponentEntityMonitorConfig;
  @Input()
  set entityConfig(entityConfig: ComponentEntityMonitorConfig) {
    if (entityConfig) {
      const entityMonitor = this.entityMonitorFactory.create(
        entityConfig.guid,
        entityConfig.schema
      );
      this.isDeleting$ = entityMonitor.isDeletingEntity$;
      this.pEntityConfig = entityConfig;
      this.pEntityMonitor = entityMonitor;
    }
  }
  private pEntityMonitor: { entity$: Observable<any> } | null = null;

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

  entityMonitorSub!: Subscription;

  public showMenu$!: Observable<boolean>;
  public isDeleting$: Observable<boolean> = observableOf(false);
  private pActionMenu!: MenuItem[];

  ngOnInit() {
    // Run the fallback favorite lookup only when the parent did NOT bind
    // [favorite]. By ngOnInit, all @Input setters have fired (including
    // [favorite]) so favoriteBound reflects whether the parent supplies its
    // own. Consumers like cf-org-card / cf-space-card / card-app build the
    // favorite with the page's endpoint id and pass it explicitly, avoiding
    // the cross-endpoint star leak that came from reading the entity-stamped
    // cfGuid (ngrx dedupes entity rows across Stratos endpoints sharing one
    // CAPI). Cards that don't bind [favorite] keep the legacy fallback.
    if (this.pEntityMonitor && !this.favoriteBound) {
      this.entityMonitorSub = this.pEntityMonitor.entity$.pipe(
        take(1),
        tap(entity => {
          this.pFavorite = this.userFavoriteManager.getFavorite(
            entity,
            this.pEntityConfig.schema.entityType,
            this.pEntityConfig.schema.endpointType
          );
        })
      ).subscribe();
    }
  }

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
