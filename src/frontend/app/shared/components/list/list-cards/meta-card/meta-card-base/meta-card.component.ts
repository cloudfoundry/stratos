import { Component, ContentChild, ContentChildren, OnInit, QueryList } from '@angular/core';
import { Input } from '@angular/core';

import { MetaCardItemComponent } from '../meta-card-item/meta-card-item.component';
import { MetaCardTitleComponent } from '../meta-card-title/meta-card-title.component';

@Component({
  selector: 'app-meta-card',
  templateUrl: './meta-card.component.html',
  styleUrls: ['./meta-card.component.scss']
})
export class MetaCardComponent implements OnInit {

  @ContentChildren(MetaCardItemComponent)
  metaItems: QueryList<MetaCardItemComponent>;

  @ContentChild(MetaCardTitleComponent)
  title: MetaCardTitleComponent;

  @Input('status')
  status: string;

  @Input('showStatus')
  showStatus: string;

  constructor() { }

  ngOnInit() {
  }

}
