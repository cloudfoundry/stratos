import { Component, ContentChild, ContentChildren, Input, QueryList } from '@angular/core';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { map } from 'rxjs/operators';

import { EntityMonitorFactory } from '../../../../../monitors/entity-monitor.factory.service';
import { CardStatus, ComponentEntityMonitorConfig } from '../../../../../shared.types';
import { MetaCardItemComponent } from '../meta-card-item/meta-card-item.component';
import { MetaCardTitleComponent } from '../meta-card-title/meta-card-title.component';


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
    }
  }

  public isDeleting$: Observable<boolean> = observableOf(false);

  @Input('actionMenu')
  set actionMenu(actionMenu: MetaCardMenuItem[]) {
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

  public _actionMenu: MetaCardMenuItem[];
  public showMenu$: Observable<boolean>;

  @Input()
  clickAction: Function = null;

  constructor(private entityMonitorFactory: EntityMonitorFactory) {
    if (this.actionMenu) {
      this.actionMenu = this.actionMenu.map(element => {
        if (!element.disabled) {
          element.disabled = observableOf(false);
        }
        return element;
      });
    }
  }

  cancelPropagation = (event) => {
    event.cancelBubble = true;
    event.stopPropagation();
  }

}
