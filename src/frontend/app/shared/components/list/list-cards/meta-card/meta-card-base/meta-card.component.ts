import { Component, ContentChild, ContentChildren, Input, QueryList } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { CardStatus } from '../../../../application-state/application-state.service';
import { MetaCardItemComponent } from '../meta-card-item/meta-card-item.component';
import { MetaCardTitleComponent } from '../meta-card-title/meta-card-title.component';

export interface MetaCardMenuItem {
  icon?: string;
  label: string;
  action: Function;
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

  @Input('status$')
  status$: Observable<CardStatus>;

  @Input('actionMenu')
  actionMenu: MetaCardMenuItem[] = null;

  @Input('clickAction')
  clickAction: Function = null;

  constructor() { }

  cancelPropagation = (event) => {
    event.cancelBubble = true;
    event.stopPropagation();
  }

}
