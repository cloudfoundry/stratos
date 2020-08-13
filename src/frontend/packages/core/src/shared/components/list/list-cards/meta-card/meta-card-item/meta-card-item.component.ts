import { ChangeDetectionStrategy, Component, ContentChild, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';

import { MetaCardKeyComponent } from '../meta-card-key/meta-card-key.component';
import { MetaCardValueComponent } from '../meta-card-value/meta-card-value.component';

@Component({
  selector: 'app-meta-card-item',
  templateUrl: './meta-card-item.component.html',
  styleUrls: ['./meta-card-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetaCardItemComponent implements OnInit {

  defaultStyle = 'row';
  styles = {
    row: 'meta-card-item-row',
    'row-top': 'meta-card-item-row-top',
    column: 'meta-card-item-column',
    'long-text': 'meta-card-item-long-text',
    'long-text-fixed': 'meta-card-item-long-text-fixed',
    multiline: 'meta-card-item-multiline',
  };
  itemStyle = 'meta-card-item-row';
  @ContentChild(MetaCardKeyComponent, { static: true })
  key: MetaCardKeyComponent;

  @ContentChild(MetaCardValueComponent, { static: true })
  value: MetaCardValueComponent;

  @ViewChild('content', { static: true }) content: TemplateRef<any>;

  @Input() customStyle = this.defaultStyle;

  ngOnInit() {
    this.itemStyle = this.styles[this.customStyle || this.defaultStyle];
  }

}
