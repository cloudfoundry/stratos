import { Component, ContentChild, ContentChildren, OnInit, QueryList } from '@angular/core';
import { Input } from '@angular/core';

import { MetaCardItemComponent } from '../meta-card-item/meta-card-item.component';
import { MetaCardTitleComponent } from '../meta-card-title/meta-card-title.component';
import { CardStatus } from '../../../../application-state/application-state.service';
import { Observable } from 'rxjs/Observable';
import { tap } from 'rxjs/operators';

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

  constructor() { }

}
