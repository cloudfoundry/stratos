import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';

import { BooleanIndicatorComponent } from '../../../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { CardCell } from '../../../../../../../../core/src/shared/components/list/list.types';
import {
  MetaCardComponent,
  MetaCardItemComponent,
  MetaCardKeyComponent,
  MetaCardTitleComponent,
  MetaCardValueComponent,
} from '../../../../../../../../core/src/shared/components/meta-card/meta-card.component';
import { MultilineTitleComponent } from '../../../../../../../../core/src/shared/components/multiline-title/multiline-title.component';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IBuildpack } from '../../../../../../cf-api.types';
import { DotContentComponent } from '../../../../../dot-content/dot-content.component';

@Component({
  selector: 'app-cf-buildpack-card',
  templateUrl: './cf-buildpack-card.component.html',
  styleUrls: ['./cf-buildpack-card.component.scss'],
  standalone: true,
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
