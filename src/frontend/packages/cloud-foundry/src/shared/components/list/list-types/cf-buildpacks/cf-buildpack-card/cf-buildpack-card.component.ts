import { Component } from '@angular/core';

import { IBuildpack } from '../../../../../../../../core/src/core/cf-api.types';
import { CardCell } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';

@Component({
  selector: 'app-cf-buildpack-card',
  templateUrl: './cf-buildpack-card.component.html',
  styleUrls: ['./cf-buildpack-card.component.scss']
})
export class CfBuildpackCardComponent extends CardCell<APIResource<IBuildpack>> { }
