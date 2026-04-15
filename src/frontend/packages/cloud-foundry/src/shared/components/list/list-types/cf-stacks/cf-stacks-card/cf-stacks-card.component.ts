import { Component , ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';

import {
  CardCell,
  MetaCardComponent,
  MetaCardItemComponent,
  MetaCardKeyComponent,
  MetaCardTitleComponent,
  MetaCardValueComponent,
  MultilineTitleComponent
} from '@stratosui/core';
import { APIResource } from '@stratosui/store';

@Component({
  selector: 'app-cf-stacks-card',
  templateUrl: './cf-stacks-card.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MetaCardComponent,
    MetaCardTitleComponent,
    MetaCardItemComponent,
    MetaCardKeyComponent,
    MetaCardValueComponent,
    MultilineTitleComponent
  ]
})
export class CfStacksCardComponent extends CardCell<APIResource> { }
