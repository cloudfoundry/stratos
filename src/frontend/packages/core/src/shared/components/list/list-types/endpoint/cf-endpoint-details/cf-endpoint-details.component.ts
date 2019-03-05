import { Component, Input } from '@angular/core';

import { EndpointModel } from '../../../../../../../../store/src/types/endpoint.types';
import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-cf-endpoint-details',
  templateUrl: './cf-endpoint-details.component.html',
  styleUrls: ['./cf-endpoint-details.component.scss']
})
export class CfEndpointDetailsComponent extends TableCellCustom<EndpointModel> {

  @Input() spaceBetween = false;
}
