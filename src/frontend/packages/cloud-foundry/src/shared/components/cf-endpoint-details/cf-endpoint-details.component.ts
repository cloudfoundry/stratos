import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomTooltipDirective } from '@stratosui/core';

import {
  EndpointListDetailsComponent,
} from '../../../../../core/src/shared/components/list/list-types/endpoint/endpoint-list.helpers';


@Component({
  selector: 'lib-cf-endpoint-details',
  templateUrl: './cf-endpoint-details.component.html',
  styleUrls: ['./cf-endpoint-details.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    CustomTooltipDirective
  ]
})
export class CfEndpointDetailsComponent extends EndpointListDetailsComponent { }
