import { Component } from '@angular/core';

import { APIResource } from '../../../../../../store/types/api.types';
import { CardCell } from '../../../list.types';

@Component({
  selector: 'app-cf-stacks-card',
  templateUrl: './cf-stacks-card.component.html',
  styleUrls: ['./cf-stacks-card.component.scss']
})
export class CfStacksCardComponent extends CardCell<APIResource> { }
