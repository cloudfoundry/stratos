import { Component } from '@angular/core';

import {
  EndpointListDetailsComponent,
} from '../../../../../core/src/shared/components/list/list-types/endpoint/endpoint-list.helpers';


@Component({
  selector: 'lib-cf-endpoint-details',
  templateUrl: './cf-endpoint-details.component.html',
  styleUrls: ['./cf-endpoint-details.component.scss']
})
export class CfEndpointDetailsComponent extends EndpointListDetailsComponent { }
