import { Component } from '@angular/core';

import { CardCell } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IBuildpack } from '../../../../../../cf-api.types';

@Component({
  selector: 'app-cf-buildpack-card',
  templateUrl: './cf-buildpack-card.component.html',
  styleUrls: ['./cf-buildpack-card.component.scss']
})
export class CfBuildpackCardComponent extends CardCell<APIResource<IBuildpack>> { }
