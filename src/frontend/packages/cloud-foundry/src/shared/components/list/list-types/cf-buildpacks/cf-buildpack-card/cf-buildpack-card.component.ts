import { DatePipe } from '@angular/common';
import { Component, ChangeDetectionStrategy } from '@angular/core';

import {
  BooleanIndicatorComponent,
  CardCell,
  DotContentComponent,
  MetaCardComponent,
  MetaCardItemComponent,
  MetaCardKeyComponent,
  MetaCardTitleComponent,
  MetaCardValueComponent,
  MultilineTitleComponent
} from '@stratosui/core';
import type { APIResource } from '@stratosui/store';
import type { IBuildpack } from '../../../../../../cf-api.types';

@Component({
  selector: 'app-cf-buildpack-card',
  templateUrl: './cf-buildpack-card.component.html',
  styleUrls: ['./cf-buildpack-card.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MetaCardComponent,
    MetaCardTitleComponent,
    MetaCardItemComponent,
    MetaCardKeyComponent,
    MetaCardValueComponent,
    MultilineTitleComponent,
    DotContentComponent,
    BooleanIndicatorComponent,
  ]
})
export class CfBuildpackCardComponent extends CardCell<APIResource<IBuildpack>> { }
