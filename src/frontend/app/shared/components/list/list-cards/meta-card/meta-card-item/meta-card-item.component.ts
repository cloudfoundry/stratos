import { ChangeDetectionStrategy, Component, ContentChild, OnInit, TemplateRef, ViewChild } from '@angular/core';

import { MetaCardKeyComponent } from '../meta-card-key/meta-card-key.component';
import { MetaCardValueComponent } from '../meta-card-value/meta-card-value.component';

@Component({
  selector: 'app-meta-card-item',
  templateUrl: './meta-card-item.component.html',
  styleUrls: ['./meta-card-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetaCardItemComponent implements OnInit {
  @ContentChild(MetaCardKeyComponent)
  key: MetaCardKeyComponent;

  @ContentChild(MetaCardValueComponent)
  value: MetaCardValueComponent;

  @ViewChild('content') content: TemplateRef<any>;

  constructor() { }

  ngOnInit() {
  }

}
