import { Component } from '@angular/core';

import { CardCell } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';

@Component({
  selector: 'app-cf-stacks-card',
  templateUrl: './cf-stacks-card.component.html',
  styleUrls: ['./cf-stacks-card.component.scss']
})
export class CfStacksCardComponent extends CardCell<APIResource> { }
