import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

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
    MatIconModule,
    MatTooltipModule
  ]
})
export class CfEndpointDetailsComponent extends EndpointListDetailsComponent { }
