import { Component, OnInit } from '@angular/core';
import { CardCell } from '../../../list.types';
import { EndpointModel } from '../../../../../../../../store/src/types/endpoint.types';
import { EndpointsService } from '../../../../../../core/endpoints.service';

@Component({
  selector: 'app-endpoint-card',
  templateUrl: './endpoint-card.component.html',
  styleUrls: ['./endpoint-card.component.scss']
})
export class EndpointCardComponent extends CardCell<EndpointModel> {

  constructor() {
    super();
   }

  // ngOnInit() {
  // }
  getLinkForEndpoint() {
    return EndpointsService.getLinkForEndpoint(this.row);
  }
}
