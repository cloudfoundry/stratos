import { ChangeDetectionStrategy, Component, ContentChild, OnInit, TemplateRef, ViewChild, Input } from '@angular/core';

import { MetaCardKeyComponent } from '../meta-card-key/meta-card-key.component';
import { MetaCardValueComponent } from '../meta-card-value/meta-card-value.component';

@Component({
  selector: 'app-meta-card-item',
  templateUrl: './meta-card-item.component.html',
  styleUrls: ['./meta-card-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetaCardItemComponent implements OnInit {

  styles = {
    'row': 'meta-card-item-row',
    'row-top': 'meta-card-item-row-top',
    'column': 'meta-card-item-column',
    'long-text': 'meta-card-item-long-text',
    'long-text-fixed': 'meta-card-item-long-text-fixed',
  };
  itemStyle = 'meta-card-item-row';
  @ContentChild(MetaCardKeyComponent)
  key: MetaCardKeyComponent;

  @ContentChild(MetaCardValueComponent)
  value: MetaCardValueComponent;

  @ViewChild('content') content: TemplateRef<any>;

  @Input() customStyle = 'row';

  constructor() {
  }

  ngOnInit() {
    this.itemStyle = this.styles[this.customStyle];
  }

}
