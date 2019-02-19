import { Component, ContentChild, ContentChildren, Input, QueryList } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { first, map, tap } from 'rxjs/operators';

import { getFavoriteFromCfEntity } from '../../../../../../core/user-favorite-helpers';
import { UserFavoriteManager } from '../../../../../../core/user-favorite-manager';
import { UserFavorite, IFavoriteMetadata } from '../../../../../../store/types/user-favorites.types';
import { EntityMonitorFactory } from '../../../../../monitors/entity-monitor.factory.service';
import { CardStatus, ComponentEntityMonitorConfig } from '../../../../../shared.types';
import { MetaCardItemComponent } from '../meta-card-item/meta-card-item.component';
import { MetaCardTitleComponent } from '../meta-card-title/meta-card-title.component';
import { AppState } from './../../../../../../store/app-state';


export interface MetaCardMenuItem {
  icon?: string;
  label: string;
  action: Function;
  can?: Observable<boolean>;
  disabled?: Observable<boolean>;
}

@Component({
  selector: 'app-meta-card',
  templateUrl: './meta-card.component.html',
  styleUrls: ['./meta-card.component.scss']
})
export class MetaCardComponent {

  @ContentChildren(MetaCardItemComponent)
  metaItems: QueryList<MetaCardItemComponent>;

  @ContentChild(MetaCardTitleComponent)
  title: MetaCardTitleComponent;

  @Input()
  status$: Observable<CardStatus>;

  @Input()
  public favorite: UserFavorite<IFavoriteMetadata>;

  @Input()
  public confirmFavoriteRemoval = false;

  userFavoriteManager: UserFavoriteManager;

  @Input()
  statusIcon = true;
  @Input()
  statusIconByTitle = false;
  @Input()
  statusIconTooltip: string;

  @Input()
  set entityConfig(entityConfig: ComponentEntityMonitorConfig) {
    if (entityConfig) {
      const entityMonitor = this.entityMonitorFactory.create(
        entityConfig.guid,
        entityConfig.schema.key,
        entityConfig.schema
      );
      this.isDeleting$ = entityMonitor.isDeletingEntity$;
      if (!this.favorite) {
        entityMonitor.entity$.pipe(
          first(),
          tap(entity => this.favorite = getFavoriteFromCfEntity(entity, entityConfig.schema.key))
        ).subscribe();
      }
    }

  }

  public isDeleting$: Observable<boolean> = observableOf(false);

  @Input('actionMenu')
  set actionMenu(actionMenu: MetaCardMenuItem[]) {
    if (actionMenu) {
      this._actionMenu = actionMenu.map(menuItem => {
        if (!menuItem.can) {
          menuItem.can = observableOf(true);
        }
        return menuItem;
      });
      this.showMenu$ = combineLatest(actionMenu.map(menuItem => menuItem.can)).pipe(
        map(cans => cans.some(can => can))
      );
    }
  }

  public _actionMenu: MetaCardMenuItem[];
  public showMenu$: Observable<boolean>;

  @Input()
  clickAction: Function = null;

  constructor(
    private entityMonitorFactory: EntityMonitorFactory,
    store: Store<AppState>
  ) {
    if (this.actionMenu) {
      this.actionMenu = this.actionMenu.map(element => {
        if (!element.disabled) {
          element.disabled = observableOf(false);
        }
        return element;
      });
    }
    this.userFavoriteManager = new UserFavoriteManager(store);
  }

  cancelPropagation = (event) => {
    event.cancelBubble = true;
    event.stopPropagation();
  }

}
